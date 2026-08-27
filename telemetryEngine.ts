import { Response } from 'express';
import { db } from './db';
import { fetchLiveWeatherForZone } from './weatherService';
import { WardMetric, EmergencyAlert } from '../src/types';

class TelemetryEngine {
  private sseClients: Set<Response> = new Set();
  private latestZoneMetrics: Map<string, WardMetric> = new Map();
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  public start(intervalMs: number = 30000) {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Initial fetch
    this.syncTelemetry();

    // Periodic telemetry loop
    this.intervalId = setInterval(() => {
      this.syncTelemetry();
    }, intervalMs);

    console.log(`[TelemetryEngine] Real-time background telemetry engine started (${intervalMs / 1000}s interval)`);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[TelemetryEngine] Background telemetry engine stopped');
  }

  public registerSSEClient(res: Response) {
    this.sseClients.add(res);
    
    // Send immediate snapshot upon connection
    const snapshot = Array.from(this.latestZoneMetrics.values());
    res.write(`data: ${JSON.stringify({ type: 'SNAPSHOT', timestamp: new Date().toISOString(), metrics: snapshot, alerts: db.getAlertsLog() })}\n\n`);

    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  public broadcast(event: { type: string; [key: string]: any }) {
    const payload = `data: ${JSON.stringify({ ...event, timestamp: new Date().toISOString() })}\n\n`;
    for (const client of this.sseClients) {
      client.write(payload);
    }
  }

  public async syncTelemetry() {
    try {
      const zones = db.getZones();
      const metricsPromises = zones.map((z) => fetchLiveWeatherForZone(z));
      const metrics = await Promise.all(metricsPromises);

      for (const m of metrics) {
        this.latestZoneMetrics.set(m.id, m);

        // Update database Ward Action Matrix dynamically
        db.updateWardActionMatrixFromTelemetry(
          m.id,
          m.wbgt,
          m.mortalityRiskIncreasePercent,
          m.hospitalizationSurgePercent
        );

        // Evaluate active triggers
        this.evaluateTriggersForWard(m);
      }

      // Broadcast telemetry update over SSE
      this.broadcast({
        type: 'TELEMETRY_UPDATE',
        metrics
      });

    } catch (err) {
      console.error('[TelemetryEngine] Error during telemetry sync:', err);
    }
  }

  private evaluateTriggersForWard(metric: WardMetric) {
    const triggers = db.getActiveTriggers();
    
    for (const trigger of triggers) {
      if (trigger.status !== 'Active') continue;

      let triggered = false;
      let reason = '';

      if (trigger.category === 'temperature' && (metric.temp > 40.0 || metric.wbgt > 32.5)) {
        triggered = true;
        reason = `WBGT of ${metric.wbgt}°C in ${metric.name} exceeded critical threshold of 32.5°C`;
      } else if (trigger.category === 'hospital' && metric.hospitalizationSurgePercent >= 30) {
        triggered = true;
        reason = `Hospital admissions surge (+${metric.hospitalizationSurgePercent}%) breached safety limit in ${metric.name}`;
      }

      if (triggered) {
        // Check if alert already issued recently to prevent spamming
        const existingAlerts = db.getAlertsLog();
        const recentDuplicate = existingAlerts.find(
          (a) => a.title.includes(metric.name) && Date.now() - new Date(a.issuedAt || 0).getTime() < 1800000
        );

        if (!recentDuplicate) {
          const autoAlert: EmergencyAlert = {
            id: `auto-alert-${Date.now()}`,
            title: `AUTOMATED EMERGENCY TRIGGER: ${metric.name}`,
            message: `${reason}. Mortality risk: +${metric.mortalityRiskIncreasePercent}%. Automated sirens, FCM push, and worker WhatsApp advisory executed.`,
            zone: metric.name,
            level: metric.wbgt >= 34.0 ? 'RED' : 'ORANGE',
            channels: ['FCM_Push', 'SMS', 'WhatsApp', 'Sirens'],
            recipientsCount: 54200,
            status: 'Issued',
            issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          db.addAlert(autoAlert);

          // Update HAP checklist automatically
          if (metric.wbgt >= 33.5) {
            db.toggleHapChecklistItem('hap-1', true);
            db.toggleHapChecklistItem('hap-2', true);
          }

          // Broadcast alert creation over SSE
          this.broadcast({
            type: 'AUTOMATED_ALERT_TRIGGERED',
            alert: autoAlert,
            metric
          });
        }
      }
    }
  }

  public getCachedMetrics(): WardMetric[] {
    return Array.from(this.latestZoneMetrics.values());
  }

  public getCachedMetric(id: string): WardMetric | undefined {
    return this.latestZoneMetrics.get(id);
  }
}

export const telemetryEngine = new TelemetryEngine();
