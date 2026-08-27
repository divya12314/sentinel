/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  NavigationScreen,
  WardMetric,
  EmergencyAlert,
  CitizenProfile,
  AdminProfile,
  WardActionMatrixRow,
  HospitalPreparednessDirective,
  HeatActionChecklistItem,
  HistoricalYearData
} from './types';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { SentinelDashboard } from './components/SentinelDashboard';
import { MortalityForecast } from './components/MortalityForecast';
import { AlertManagement } from './components/AlertManagement';
import { CityResources } from './components/CityResources';
import { AuthModal } from './components/AuthModal';
import { FcmNotificationBanner } from './components/FcmNotificationBanner';

// Citizen Portal Components
import { CitizenHome } from './components/citizen/CitizenHome';
import { CitizenHydration } from './components/citizen/CitizenHydration';
import { CitizenFacilitiesMap } from './components/citizen/CitizenFacilitiesMap';
import { CitizenAlertsFeed } from './components/citizen/CitizenAlertsFeed';
import { CitizenTopBar } from './components/citizen/CitizenTopBar';
import { CitizenNavBar } from './components/citizen/CitizenNavBar';

// Admin Portal Components
import { WardActionMatrix } from './components/admin/WardActionMatrix';
import { HistoricalHealthImpact } from './components/admin/HistoricalHealthImpact';
import { HospitalPreparednessHub } from './components/admin/HospitalPreparednessHub';
import { AutomatedTriggersChecklist } from './components/admin/AutomatedTriggersChecklist';

// Data & Helpers
import { INITIAL_ZONES, INITIAL_CITY_RESOURCES } from './data/zonesData';
import {
  DEFAULT_CITIZEN_PROFILE,
  DEFAULT_ADMIN_PROFILE,
  INITIAL_WARD_ACTION_MATRIX,
  INITIAL_HISTORICAL_DATA,
  INITIAL_HOSPITAL_DIRECTIVES,
  INITIAL_HEAT_ACTION_CHECKLIST
} from './data/portalData';
import {
  calculateOutdoorWBGT,
  calculateUTCI,
  calculateHTSI,
  getWBGTRiskLevel,
  predictMortalityAndHospitalSurge
} from './utils/thermalStress';
import { calculateDailyWaterRequirement } from './utils/hydrationCalculator';

// Build initial fallback state
const defaultZoneMetrics: WardMetric[] = INITIAL_ZONES.map((z, idx) => {
  const isWest = z.id === 'ward-12-west';
  const temp = isWest ? 40.0 : 38.5 + (idx % 3);
  const humidity = isWest ? 65 : 55 + (idx * 4);
  const wbgt = isWest ? 34.5 : calculateOutdoorWBGT(temp, humidity, 800, 5.0);
  const utci = calculateUTCI(temp, humidity, 5.0);
  const htsi = calculateHTSI(wbgt, utci);
  const { mortalityRiskPercent, hospitalizationSurgePercent } = predictMortalityAndHospitalSurge(
    wbgt,
    z.elderlyDensityPercent,
    z.outdoorWorkerDensityPercent
  );

  return {
    id: z.id,
    name: z.name,
    zone: z.zone,
    city: z.city,
    state: z.state,
    lat: z.lat,
    lng: z.lng,
    temp,
    humidity,
    windSpeed: 5.5,
    solarRad: 'High',
    solarRadiationValue: 820,
    wbgt,
    utci,
    htsi,
    riskLevel: wbgt >= 34.0 ? 'Critical' : getWBGTRiskLevel(wbgt),
    mortalityRiskIncreasePercent: isWest ? 15 : mortalityRiskPercent,
    hospitalizationSurgePercent,
    vulnerabilityFactors: {
      elderlyDensityPercent: z.elderlyDensityPercent,
      outdoorWorkerDensityPercent: z.outdoorWorkerDensityPercent,
      slumHousingDensityPercent: z.slumHousingDensityPercent,
      greenCoverPercent: z.greenCoverPercent
    },
    advisoryText: `Critical WBGT of ${wbgt}°C. Mortality risk elevated (+${isWest ? 15 : mortalityRiskPercent}%).`,
    lastUpdated: new Date().toISOString()
  };
});

export default function App() {
  // Portal Role & Auth
  const [userRole, setUserRole] = useState<'citizen' | 'admin'>('citizen');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [citizenProfile, setCitizenProfile] = useState<CitizenProfile>(DEFAULT_CITIZEN_PROFILE);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(DEFAULT_ADMIN_PROFILE);

  // Active Screen
  const [currentScreen, setCurrentScreen] = useState<NavigationScreen>('citizen_home');

  // Core App Data
  const [zones, setZones] = useState<WardMetric[]>(defaultZoneMetrics);
  const [selectedZone, setSelectedZone] = useState<WardMetric>(defaultZoneMetrics[0]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([
    {
      id: 'alert-1',
      title: 'RED ALERT - West Zone Heatwave',
      message: 'Mortality Risk +15% expected. Triggering automated SMS & WhatsApp alerts to outdoor workers in Ward 12.',
      zone: 'Ward 12 - West Zone',
      level: 'RED',
      channels: ['SMS', 'WhatsApp', 'FCM_Push'],
      recipientsCount: 42800,
      status: 'Issued',
      issuedAt: '11:00 AM'
    },
    {
      id: 'alert-2',
      title: 'ORANGE ADVISORY - Central & North Ward Hydration',
      message: 'WBGT reached 33.2°C. Potable water stations operational at LNJP and Connaught Place shelters.',
      zone: 'Central Zone',
      level: 'ORANGE',
      channels: ['SMS', 'FCM_Push'],
      recipientsCount: 28400,
      status: 'Issued',
      issuedAt: '10:15 AM'
    }
  ]);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(true);

  // Municipal Admin Data States
  const [wardMatrix, setWardMatrix] = useState<WardActionMatrixRow[]>(INITIAL_WARD_ACTION_MATRIX);
  const [hospitalDirectives, setHospitalDirectives] = useState<HospitalPreparednessDirective[]>(INITIAL_HOSPITAL_DIRECTIVES);
  const [hapChecklist, setHapChecklist] = useState<HeatActionChecklistItem[]>(INITIAL_HEAT_ACTION_CHECKLIST);
  const [historicalData] = useState<HistoricalYearData[]>(INITIAL_HISTORICAL_DATA['ward-12-west']);

  // Floating FCM Push Notification Banner
  const [fcmIncomingAlert, setFcmIncomingAlert] = useState<EmergencyAlert | null>(null);

  // Sync profile hydration calculation when zone or profile changes
  useEffect(() => {
    const calc = calculateDailyWaterRequirement(citizenProfile, selectedZone);
    setCitizenProfile((prev) => ({
      ...prev,
      dailyWaterTargetMl: calc.totalTargetMl
    }));
  }, [selectedZone.wbgt, citizenProfile.weightKg, citizenProfile.activityIntensity, citizenProfile.outdoorExposure]);

  // Load backend data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [zonesRes, alertsRes, matrixRes, hospRes, hapRes] = await Promise.allSettled([
          fetch('/api/zones'),
          fetch('/api/alerts'),
          fetch('/api/matrix'),
          fetch('/api/hospital-directives'),
          fetch('/api/hap')
        ]);

        if (zonesRes.status === 'fulfilled' && zonesRes.value.ok) {
          const zData = await zonesRes.value.json();
          if (zData && zData.length > 0) {
            setZones(zData);
            const match = zData.find((z: WardMetric) => z.id === selectedZone.id) || zData[0];
            setSelectedZone(match);
          }
        }

        if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
          const aData = await alertsRes.value.json();
          if (aData.alertsLog) setAlerts(aData.alertsLog);
        }

        if (matrixRes.status === 'fulfilled' && matrixRes.value.ok) {
          const mData = await matrixRes.value.json();
          if (mData && mData.length > 0) setWardMatrix(mData);
        }

        if (hospRes.status === 'fulfilled' && hospRes.value.ok) {
          const hData = await hospRes.value.json();
          if (hData && hData.length > 0) setHospitalDirectives(hData);
        }

        if (hapRes.status === 'fulfilled' && hapRes.value.ok) {
          const hapData = await hapRes.value.json();
          if (hapData && hapData.length > 0) setHapChecklist(hapData);
        }
      } catch (err) {
        console.warn('Initial server sync:', err);
      }
    }

    loadData();
    const interval = setInterval(loadData, 45000);
    return () => clearInterval(interval);
  }, []);

  // Handlers for Citizen Portal
  const handleLogWater = async (amountMl: number) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedLogs = [...citizenProfile.waterLogs, { time: timeStr, amountMl }];
    const updatedIntake = citizenProfile.waterIntakeMl + amountMl;

    const newProfile = {
      ...citizenProfile,
      waterIntakeMl: updatedIntake,
      waterLogs: updatedLogs
    };

    setCitizenProfile(newProfile);

    try {
      await fetch('/api/citizen/log-water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: citizenProfile.email, amountMl })
      });
    } catch {
      // Local fallback handled
    }
  };

  const handleCitizenProfileSave = (profile: CitizenProfile) => {
    setCitizenProfile(profile);
    setUserRole('citizen');
    setCurrentScreen('citizen_home');
    setShowAuthModal(false);
  };

  const handleAdminLoginSuccess = (profile: AdminProfile) => {
    setAdminProfile(profile);
    setUserRole('admin');
    setCurrentScreen('dashboard');
    setShowAuthModal(false);
  };

  const handleToggleFcmPush = async () => {
    const newState = !citizenProfile.fcmPushEnabled;
    setCitizenProfile((prev) => ({ ...prev, fcmPushEnabled: newState }));
    try {
      await fetch('/api/citizen/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...citizenProfile, fcmPushEnabled: newState })
      });
    } catch {
      // Local fallback
    }
  };

  // Handlers for Municipal Admin Portal
  const handleTriggerWardAction = async (wardId: string, actionType: 'tankers' | 'cooling' | 'general') => {
    setWardMatrix((prev) =>
      prev.map((row) =>
        row.wardId === wardId ? { ...row, actionStatus: 'Dispatched' } : row
      )
    );

    try {
      await fetch('/api/matrix/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wardId, actionType })
      });
    } catch {
      // Local state preserved
    }
  };

  const handleUpdateHospitalDirective = async (id: string, additionalIvBags: number, reservedBeds: number) => {
    setHospitalDirectives((prev) =>
      prev.map((hosp) =>
        hosp.id === id
          ? {
              ...hosp,
              ivBagsInStock: hosp.ivBagsInStock + additionalIvBags,
              heatstrokeBedsAvailable: hosp.heatstrokeBedsAvailable + reservedBeds
            }
          : hosp
      )
    );

    try {
      await fetch(`/api/hospital-directives/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ivBagsInStock: (hospitalDirectives.find((h) => h.id === id)?.ivBagsInStock || 0) + additionalIvBags,
          heatstrokeBedsAvailable: (hospitalDirectives.find((h) => h.id === id)?.heatstrokeBedsAvailable || 0) + reservedBeds
        })
      });
    } catch {
      // Local fallback handled
    }
  };

  const handleToggleHapChecklist = async (id: string, completed: boolean) => {
    setHapChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed } : item))
    );

    try {
      await fetch(`/api/hap/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
    } catch {
      // Local fallback
    }
  };

  // Dispatch Automated Regional FCM Broadcast
  const handleDispatchFcmBroadcast = async (
    title: string,
    message: string,
    targetWard: string,
    level: 'YELLOW' | 'ORANGE' | 'RED'
  ) => {
    const newAlert: EmergencyAlert = {
      id: `alert-${Date.now()}`,
      title,
      message,
      zone: targetWard,
      level,
      channels: ['FCM_Push', 'SMS', 'WhatsApp'],
      recipientsCount: 52400,
      status: 'Issued',
      issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setHasUnreadAlerts(true);
    setFcmIncomingAlert(newAlert);

    try {
      await fetch('/api/alerts/fcm-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWard,
          alertLevel: level,
          message,
          channels: ['fcm', 'whatsapp', 'sms']
        })
      });
    } catch {
      // Local fallback handled
    }
  };

  const handleNavigate = (screen: NavigationScreen) => {
    setCurrentScreen(screen);
    if (screen === 'alerts' || screen === 'citizen_alerts') {
      setHasUnreadAlerts(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0f172a] flex flex-col font-sans antialiased selection:bg-red-500 selection:text-white">
      {/* Floating FCM Push Notification Banner */}
      <FcmNotificationBanner
        alert={fcmIncomingAlert}
        onDismiss={() => setFcmIncomingAlert(null)}
        onViewAlert={(alert) => {
          setFcmIncomingAlert(null);
          if (userRole === 'citizen') {
            handleNavigate('citizen_alerts');
          } else {
            handleNavigate('alerts');
          }
        }}
      />

      {/* Dual Portal Auth & Login Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          initialRole={userRole}
          currentCitizenProfile={citizenProfile}
          currentAdminProfile={adminProfile}
          onCitizenLogin={handleCitizenProfileSave}
          onAdminLogin={handleAdminLoginSuccess}
          onSelectCitizen={handleCitizenProfileSave}
          onSelectAdmin={handleAdminLoginSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* CITIZEN / WORKER PORTAL VIEW */}
      {/* ========================================================================= */}
      {userRole === 'citizen' && (
        <>
          <CitizenTopBar
            profile={citizenProfile}
            zone={selectedZone}
            alerts={alerts}
            onOpenAlerts={() => handleNavigate('citizen_alerts')}
            onSwitchPortal={() => setShowAuthModal(true)}
            onOpenProfile={() => setShowAuthModal(true)}
          />

          {/* Desktop Tab Bar for Citizen Portal */}
          <div className="hidden md:block pt-16 bg-[#0f172a] border-b border-slate-800">
            <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
              <div className="flex gap-6">
                {[
                  { id: 'citizen_home', label: 'Health & Heat Status', icon: 'health_and_safety' },
                  { id: 'citizen_hydration', label: 'Hydration & Rest Interval', icon: 'water_drop' },
                  { id: 'citizen_map', label: 'Emergency Facilities Map', icon: 'emergency_home' },
                  { id: 'citizen_alerts', label: 'Alerts & FCM Feed', icon: 'campaign' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleNavigate(tab.id as NavigationScreen)}
                    className={`py-3.5 px-2 border-b-2 font-bold text-xs flex items-center gap-2 transition-all ${
                      currentScreen === tab.id
                        ? 'border-blue-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.id === 'citizen_alerts' && hasUnreadAlerts && (
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span>Location:</span>
                <strong className="text-white font-mono">{selectedZone.name}</strong>
              </div>
            </div>
          </div>

          {/* Citizen Content Routing */}
          <main className="flex-1 flex flex-col pt-20 md:pt-6 px-4 md:px-6 pb-24 md:pb-8 max-w-6xl mx-auto w-full">
            {currentScreen === 'citizen_home' && (
              <CitizenHome
                profile={citizenProfile}
                zone={selectedZone}
                allZones={zones}
                onSelectZone={(z) => setSelectedZone(z)}
                onNavigate={(s) => handleNavigate(s)}
                onLogWater={handleLogWater}
                onUpdateProfile={() => setShowAuthModal(true)}
              />
            )}

            {currentScreen === 'citizen_hydration' && (
              <CitizenHydration
                profile={citizenProfile}
                zone={selectedZone}
                onLogWater={handleLogWater}
                onNavigateBack={() => handleNavigate('citizen_home')}
              />
            )}

            {currentScreen === 'citizen_map' && (
              <CitizenFacilitiesMap
                resources={INITIAL_CITY_RESOURCES}
                currentZone={selectedZone}
                profile={citizenProfile}
                onNavigateBack={() => handleNavigate('citizen_home')}
              />
            )}

            {currentScreen === 'citizen_alerts' && (
              <CitizenAlertsFeed
                alerts={alerts}
                profile={citizenProfile}
                zone={selectedZone}
                onNavigateBack={() => handleNavigate('citizen_home')}
                onToggleFcm={handleToggleFcmPush}
              />
            )}
          </main>

          {/* Citizen Mobile Bottom Navigation */}
          <div className="md:hidden">
            <CitizenNavBar
              currentScreen={currentScreen}
              onNavigate={handleNavigate}
              hasUnreadAlerts={hasUnreadAlerts}
            />
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MUNICIPAL ADMIN PORTAL VIEW */}
      {/* ========================================================================= */}
      {userRole === 'admin' && (
        <>
          <TopAppBar
            alerts={alerts}
            adminProfile={adminProfile}
            onOpenAlerts={() => handleNavigate('alerts')}
            onSwitchPortal={() => setShowAuthModal(true)}
          />

          {/* Desktop Navigation Tabs for Admin */}
          <div className="hidden md:block pt-16 bg-[#131b2e] border-b border-[#3f465c]/30">
            <div className="max-w-[1440px] mx-auto px-8 flex gap-6">
              {[
                { id: 'dashboard', label: 'GIS Heat Map', icon: 'grid_view' },
                { id: 'matrix', label: 'Ward Action Matrix', icon: 'table_chart' },
                { id: 'historical', label: 'Historical Health Impact', icon: 'query_stats' },
                { id: 'forecast', label: 'Mortality Forecast', icon: 'show_chart' },
                { id: 'alerts', label: 'Automated Triggers & HAP', icon: 'campaign' },
                { id: 'resources', label: 'Hospital Preparedness', icon: 'local_hospital' }
              ].map((tab) => (
                <a
                  key={tab.id}
                  id={`desktop-nav-${tab.id}`}
                  href={`#${tab.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate(tab.id as NavigationScreen);
                  }}
                  className={`py-3 px-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors ${
                    currentScreen === tab.id
                      ? 'border-[#da3437] text-white'
                      : 'border-transparent text-[#bec6e0] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === 'alerts' && hasUnreadAlerts && (
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Admin Screen Routing */}
          <main className="flex-1 flex flex-col pt-20 md:pt-4 px-4 md:px-8 pb-20 md:pb-6 max-w-[1440px] mx-auto w-full">
            {currentScreen === 'dashboard' && (
              <SentinelDashboard
                zones={zones}
                selectedZone={selectedZone}
                onSelectZone={(z) => setSelectedZone(z)}
                onNavigate={handleNavigate}
                onAlertTriggered={() => handleDispatchFcmBroadcast(
                  'CRITICAL RED ALERT: Outdoor Labor Cease Directive',
                  'WBGT critical threshold exceeded. Immediate mandatory work pause 11am-4pm.',
                  selectedZone.name,
                  'RED'
                )}
              />
            )}

            {currentScreen === 'matrix' && (
              <WardActionMatrix
                matrix={wardMatrix}
                onTriggerAction={handleTriggerWardAction}
              />
            )}

            {currentScreen === 'historical' && (
              <HistoricalHealthImpact
                historicalData={historicalData}
                selectedZone={selectedZone}
                allZones={zones}
                onSelectZone={(z) => setSelectedZone(z)}
              />
            )}

            {currentScreen === 'forecast' && (
              <MortalityForecast
                selectedZone={selectedZone}
              />
            )}

            {currentScreen === 'alerts' && (
              <AutomatedTriggersChecklist
                checklist={hapChecklist}
                onToggleItem={handleToggleHapChecklist}
                onDispatchFcmBroadcast={handleDispatchFcmBroadcast}
                allZones={zones}
              />
            )}

            {currentScreen === 'resources' && (
              <HospitalPreparednessHub
                directives={hospitalDirectives}
                onUpdateDirective={handleUpdateHospitalDirective}
              />
            )}
          </main>

          {/* Bottom Navigation for Admin Mobile */}
          <div className="md:hidden">
            <BottomNavBar
              currentScreen={currentScreen}
              onNavigate={handleNavigate}
              hasUnreadAlerts={hasUnreadAlerts}
            />
          </div>
        </>
      )}
    </div>
  );
}
