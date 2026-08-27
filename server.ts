import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db';
import { telemetryEngine } from './server/telemetryEngine';
import { fetchLiveWeatherForZone, fetch5DayForecast } from './server/weatherService';
import { generatePublicHealthAdvisory } from './server/geminiService';
import {
  CityResource,
  ActiveTrigger,
  EmergencyAlert,
  HeatActionChecklistItem
} from './src/types';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Start background telemetry engine (polls live weather, updates DB, dispatches triggers & SSE events)
  telemetryEngine.start(30000);

  // API Routes

  // 1. Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      mode: 'production_ready_realtime',
      database: 'persistent_json_store',
      telemetry: 'active',
      timestamp: new Date().toISOString()
    });
  });

  // 2. Real-Time Stream (Server-Sent Events - SSE)
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    telemetryEngine.registerSSEClient(res);
  });

  // 3. Zone Telemetry Endpoints
  app.get('/api/zones', async (req, res) => {
    try {
      let metrics = telemetryEngine.getCachedMetrics();
      if (metrics.length === 0) {
        const zones = db.getZones();
        metrics = await Promise.all(zones.map((z) => fetchLiveWeatherForZone(z)));
      }
      res.json(metrics);
    } catch (err) {
      console.error('Error fetching zone metrics:', err);
      res.status(500).json({ error: 'Failed to fetch zone metrics' });
    }
  });

  app.get('/api/zones/:id', async (req, res) => {
    try {
      const zoneId = req.params.id;
      let metric = telemetryEngine.getCachedMetric(zoneId);
      if (!metric) {
        const zones = db.getZones();
        const config = zones.find((z) => z.id === zoneId) || zones[0];
        metric = await fetchLiveWeatherForZone(config);
      }
      res.json(metric);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch zone' });
    }
  });

  // 4. 3-5 Day Forecast Endpoint
  app.get('/api/forecast/:id', async (req, res) => {
    try {
      const zoneId = req.params.id;
      const zones = db.getZones();
      const zoneConfig = zones.find((z) => z.id === zoneId) || zones[0];
      const forecast = await fetch5DayForecast(zoneConfig);
      res.json(forecast);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch forecast' });
    }
  });

  // 5. Emergency Alerts Management
  app.get('/api/alerts', (req, res) => {
    const alertsLog = db.getAlertsLog();
    const activeTriggers = db.getActiveTriggers();
    const recipientSegments = db.getRecipientSegments();
    const interventionStatus = db.getInterventionStatus();

    res.json({
      activeTriggers,
      recipientSegments,
      advisoryToggles: {
        hospitalSpikeAlert: interventionStatus.hospitalSpikeAlertActive,
        gridOverloadWarning: interventionStatus.gridOverloadWarningActive
      },
      latestAlert: alertsLog[0] || null,
      alertsLog
    });
  });

  // Issue emergency broadcast alert
  app.post('/api/alerts/broadcast', (req, res) => {
    const { zone, message, channels = ['SMS', 'WhatsApp'], recipientsCount = 42800, level = 'RED' } = req.body;
    const newAlert: EmergencyAlert = {
      id: `alert-${Date.now()}`,
      title: `URGENT HEAT ADVISORY: ${zone || 'West Zone'}`,
      message: message || 'Avoid outdoor exposure 11am-4pm. Nearest cooling center and hydration station active.',
      zone: zone || 'Ward 12 - West Zone',
      level,
      channels,
      recipientsCount,
      status: 'Issued',
      issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    db.addAlert(newAlert);
    telemetryEngine.broadcast({ type: 'ALERT_BROADCASTED', alert: newAlert });

    res.json({ success: true, alert: newAlert, dispatchedTo: recipientsCount });
  });

  // Acknowledge & Escalate alert
  app.post('/api/alerts/acknowledge', (req, res) => {
    const { zoneId, actionNotes } = req.body;
    db.updateInterventionStatus({
      coolingCentersOpened: true,
      hospitalSpikeAlertActive: true
    });

    const escalationAlert: EmergencyAlert = {
      id: `alert-esc-${Date.now()}`,
      title: 'ESCALATION ACKNOWLEDGED - Heat Action Plan Level 3',
      message: 'Automated SMS alerts triggered to outdoor workers. Rapid response personnel dispatched.',
      zone: zoneId || 'Ward 12 - West Zone',
      level: 'RED',
      channels: ['SMS', 'WhatsApp', 'IVR', 'FCM_Push'],
      recipientsCount: 42800,
      status: 'Escalated',
      issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionTaken: actionNotes || 'Cooling centers opened; SMS broadcast executed; Emergency triage placed on Code Red.'
    };

    db.addAlert(escalationAlert);
    telemetryEngine.broadcast({ type: 'ALERT_ESCALATED', alert: escalationAlert });

    res.json({
      success: true,
      message: 'Heat Action Protocol Level 3 Activated',
      alert: escalationAlert,
      interventionStatus: db.getInterventionStatus()
    });
  });

  // Toggle trigger
  app.post('/api/alerts/triggers/toggle', (req, res) => {
    const { triggerId, status } = req.body;
    const updated = db.toggleTriggerStatus(triggerId, status);
    res.json({ success: true, activeTriggers: updated });
  });

  // Toggle advisory management checkboxes
  app.post('/api/alerts/advisories/toggle', (req, res) => {
    const { type, value } = req.body;
    if (type === 'hospitalSpike') {
      db.updateInterventionStatus({ hospitalSpikeAlertActive: value });
    } else if (type === 'gridOverload') {
      db.updateInterventionStatus({ gridOverloadWarningActive: value });
    }
    res.json({ success: true, interventionStatus: db.getInterventionStatus() });
  });

  // Automated FCM Regional Push Trigger
  app.post('/api/alerts/fcm-push', (req, res) => {
    const { title, message, targetWard, level = 'RED' } = req.body;
    const fcmAlert: EmergencyAlert = {
      id: `fcm-${Date.now()}`,
      title: title || `FCM AUTOMATED TRIGGER: ${targetWard || 'Regional Zone'} Heat Action Plan`,
      message: message || 'WBGT > 33.5°C threshold breached. Immediate hydration and work halt mandatory.',
      zone: targetWard || 'Regional Zone',
      level,
      channels: ['FCM_Push', 'WhatsApp', 'SMS'],
      recipientsCount: 52400,
      status: 'Issued',
      issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    db.addAlert(fcmAlert);
    telemetryEngine.broadcast({ type: 'FCM_ALERT_TRIGGERED', alert: fcmAlert });

    res.json({
      success: true,
      fcmDelivered: true,
      alert: fcmAlert,
      timestamp: new Date().toISOString()
    });
  });

  // 6. Interventions Endpoints
  app.get('/api/interventions', (req, res) => {
    res.json(db.getInterventionStatus());
  });

  app.post('/api/interventions/toggle', (req, res) => {
    const { intervention, value } = req.body;
    if (intervention === 'coolingCenters') {
      db.updateInterventionStatus({
        coolingCentersOpened: value,
        coolingCentersOpenedAt: value ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
      });
    } else if (intervention === 'powerGrid') {
      db.updateInterventionStatus({ powerGridAdjusted: value });
    }
    res.json({ success: true, interventionStatus: db.getInterventionStatus() });
  });

  // 7. City Resources & Hotspots Endpoints
  app.get('/api/resources', (req, res) => {
    res.json({
      resources: db.getCityResources(),
      hotspots: db.getHotspots()
    });
  });

  app.post('/api/resources/update', (req, res) => {
    const { resourceId, capacityPercent, status } = req.body;
    const updated = db.updateCityResource(resourceId, capacityPercent, status);
    telemetryEngine.broadcast({ type: 'RESOURCE_UPDATED', resource: updated });
    res.json({ success: true, resources: db.getCityResources() });
  });

  app.post('/api/resources/dispatch', (req, res) => {
    const { type, ward } = req.body;
    const newRes: CityResource = {
      id: `res-${Date.now()}`,
      name: `${ward || 'Ward'} Emergency ${type === 'water' ? 'Hydration Tanker' : 'Mobile Medical Unit'}`,
      type: type === 'water' ? 'hydration_van' : 'cooling_center',
      ward: ward || 'Ward 12',
      capacityPercent: 15,
      currentOccupancy: 30,
      maxCapacity: 500,
      lat: 23.0338 + (Math.random() * 0.02 - 0.01),
      lng: 72.5467 + (Math.random() * 0.02 - 0.01),
      status: 'Optimal',
      address: `${ward || 'Ward 12'} Rapid Response Route`,
      contactNumber: '+91 79 2658 9911'
    };

    db.addCityResource(newRes);
    telemetryEngine.broadcast({ type: 'RESOURCE_DISPATCHED', resource: newRes });

    res.json({ success: true, resource: newRes, resources: db.getCityResources() });
  });

  // 8. AI Public Health Advisory Generator (Gemini 3.7 Flash)
  app.post('/api/ai/advisory', async (req, res) => {
    try {
      const { zoneName, wbgt, temp, humidity, mortalityIncrease, vulnerableGroups } = req.body;
      const result = await generatePublicHealthAdvisory(
        zoneName || 'Ward 12 - West Zone',
        wbgt || 34.5,
        temp || 40.0,
        humidity || 65,
        mortalityIncrease || 18,
        vulnerableGroups || ['Elderly 65+', 'Outdoor construction laborers', 'Slum residents without active cooling']
      );
      res.json(result);
    } catch (err) {
      console.error('Error generating AI advisory:', err);
      res.status(500).json({ error: 'Failed to generate advisory' });
    }
  });

  // 9. Citizen Profile & Hydration Tracking Endpoints
  app.get('/api/citizen/profile', (req, res) => {
    const email = req.query.email as string;
    res.json(db.getCitizenProfile(email));
  });

  app.post('/api/citizen/profile', (req, res) => {
    const updated = db.updateCitizenProfile(req.body);
    res.json({ success: true, profile: updated });
  });

  // Dual route aliases for water logging compatibility
  const handleWaterLog = (req: express.Request, res: express.Response) => {
    const { email, amountMl = 250 } = req.body;
    const result = db.addWaterLog(email || 'default', Number(amountMl));
    res.json({
      success: true,
      waterIntakeMl: result.waterIntakeMl,
      waterLogs: result.waterLogs
    });
  };

  app.post('/api/citizen/water/log', handleWaterLog);
  app.post('/api/citizen/log-water', handleWaterLog);

  // 10. Municipal Admin Auth & Verification Endpoints
  app.post('/api/admin/login', (req, res) => {
    const { email, departmentRole, phone } = req.body;
    if (!email || !departmentRole) {
      return res.status(400).json({ error: 'Email and department role are required' });
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const cleanPhone = phone || '+91 98201 45678';
    db.setOTP(cleanPhone, generatedOtp, 600000); // 10 min TTL

    res.json({
      success: true,
      message: `OTP dispatched to registered officer mobile ${cleanPhone}`,
      phone: cleanPhone,
      demoOtp: generatedOtp
    });
  });

  app.post('/api/admin/verify-otp', (req, res) => {
    const { email, departmentRole, phone, otp } = req.body;
    const cleanPhone = phone || '+91 98201 45678';

    if (db.verifyOTP(cleanPhone, otp)) {
      const adminProfile = {
        officialEmail: email || 'officer.deshmukh@gcc.gov.in',
        departmentRole: departmentRole || 'Disaster Management & Public Health',
        phone: cleanPhone,
        isAuthenticated: true,
        loginTime: new Date().toISOString()
      };
      res.json({
        success: true,
        authenticated: true,
        adminProfile
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid or expired OTP code' });
    }
  });

  // 11. Ward Action Matrix Endpoints
  app.get('/api/matrix', (req, res) => {
    res.json(db.getWardActionMatrix());
  });

  app.post('/api/matrix/action', (req, res) => {
    const { wardId, actionType } = req.body;
    const updated = db.updateWardActionStatus(wardId, actionType);
    res.json({ success: true, matrix: updated });
  });

  // 12. Historical Health Impact Endpoint
  app.get('/api/historical/:wardId', (req, res) => {
    const wardId = req.params.wardId || 'ward-12-west';
    res.json(db.getHistoricalData(wardId));
  });

  // 13. Hospital Preparedness Directives Endpoints
  app.get('/api/hospital-directives', (req, res) => {
    res.json(db.getHospitalDirectives());
  });

  app.post('/api/hospital-directives/alert', (req, res) => {
    const { directiveId, additionalIvBags, reservedBeds } = req.body;
    const updated = db.updateHospitalDirective(directiveId, additionalIvBags, reservedBeds);
    res.json({ success: true, hospitalDirectives: updated });
  });

  // 14. Heat Action Plan (HAP) Checklist Endpoints (with dual route aliases)
  const handleGetHap = (req: express.Request, res: express.Response) => {
    res.json(db.getHapChecklist());
  };

  app.get('/api/hap', handleGetHap);
  app.get('/api/hap/checklist', handleGetHap);

  app.post('/api/hap/checklist/toggle', (req, res) => {
    const { itemId, completed } = req.body;
    const updated = db.toggleHapChecklistItem(itemId, completed);
    res.json({ success: true, hapChecklist: updated });
  });

  // Vite development middleware or production static server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sentinel Core Server] Backend running in real-time mode on http://0.0.0.0:${PORT}`);
  });
}

startServer();
