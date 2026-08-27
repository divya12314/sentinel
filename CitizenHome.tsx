import React, { useState } from 'react';
import { CitizenProfile, WardMetric } from '../../types';
import { generatePersonalizedHealthAdvisory, calculateDailyWaterRequirement } from '../../utils/hydrationCalculator';

interface CitizenHomeProps {
  profile: CitizenProfile;
  zone: WardMetric;
  allZones: WardMetric[];
  onSelectZone: (zone: WardMetric) => void;
  onNavigate: (screen: 'citizen_home' | 'citizen_map' | 'citizen_hydration' | 'citizen_alerts') => void;
  onQuickLogWater: (amountMl: number) => void;
  onOpenProfileModal: () => void;
}

export const CitizenHome: React.FC<CitizenHomeProps> = ({
  profile,
  zone,
  allZones,
  onSelectZone,
  onNavigate,
  onQuickLogWater,
  onOpenProfileModal
}) => {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string>('');

  const advisory = generatePersonalizedHealthAdvisory(profile, zone);
  const hydration = calculateDailyWaterRequirement(profile, zone);

  const waterProgressPercent = Math.min(
    100,
    Math.round(((profile.waterIntakeMl || 0) / (profile.dailyWaterTargetMl || 3500)) * 100)
  );

  const handleUseGpsLocation = () => {
    setGpsLoading(true);
    setGpsMessage('Acquiring precise GPS coordinates...');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLoading(false);
          setGpsMessage(`Live GPS locked: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`);
          // Find closest ward in dataset
          let closest = allZones[0];
          let minDist = 999999;
          allZones.forEach((z) => {
            const d = Math.hypot(z.lat - pos.coords.latitude, z.lng - pos.coords.longitude);
            if (d < minDist) {
              minDist = d;
              closest = z;
            }
          });
          onSelectZone(closest);
          setTimeout(() => setGpsMessage(''), 4000);
        },
        () => {
          setGpsLoading(false);
          setGpsMessage('Location permission bypassed. Using Ward 12 - West Zone (Ahmedabad).');
          setTimeout(() => setGpsMessage(''), 4000);
        },
        { timeout: 5000 }
      );
    } else {
      setGpsLoading(false);
      setGpsMessage('Geolocation not supported by device.');
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Critical':
        return 'bg-red-700 text-white ring-2 ring-red-500 animate-pulse';
      case 'Severe':
        return 'bg-amber-600 text-white';
      case 'High':
        return 'bg-orange-500 text-white';
      case 'Moderate':
        return 'bg-yellow-400 text-gray-900';
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Profile Summary Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-600 font-bold text-lg">
              <span className="material-symbols-outlined text-2xl">person_pin</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">{profile.email}</h1>
                <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {profile.outdoorExposure === 'high_exposure' ? 'Outdoor Worker' : 'Citizen'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                <span>Age: <strong>{profile.age} yrs</strong></span>
                <span>•</span>
                <span>Weight: <strong>{profile.weightKg} kg</strong></span>
                <span>•</span>
                <span>Activity: <strong className="capitalize">{profile.activityIntensity.replace('_', ' ')}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-change-profile"
              onClick={onOpenProfileModal}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              Edit Health Profile
            </button>
            <button
              id="btn-gps-detect"
              onClick={handleUseGpsLocation}
              disabled={gpsLoading}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm animate-spin-reverse">
                {gpsLoading ? 'sync' : 'my_location'}
              </span>
              {gpsLoading ? 'Detecting...' : 'Auto GPS Location'}
            </button>
          </div>
        </div>

        {gpsMessage && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-blue-600">check_circle</span>
            {gpsMessage}
          </div>
        )}

        {/* Location selector dropdown */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="material-symbols-outlined text-red-600 text-base">location_on</span>
            <span className="font-semibold">Current Monitored Zone:</span>
            <select
              id="select-citizen-zone"
              value={zone.id}
              onChange={(e) => {
                const z = allZones.find((item) => item.id === e.target.value);
                if (z) onSelectZone(z);
              }}
              className="bg-gray-100 border border-gray-300 font-bold text-gray-900 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {allZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.city}, {z.state})
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-gray-500">
            Last Telemetry Update: <strong className="font-mono text-gray-700">{zone.lastUpdated}</strong>
          </div>
        </div>
      </div>

      {/* Main Thermal Risk Assessment Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                Personalized Real-Time Heat Assessment
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide ${getRiskBadgeColor(advisory.healthRiskLevel)}`}>
                {advisory.healthRiskLevel.toUpperCase()} RISK
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {advisory.healthRiskLevel === 'Critical' || advisory.healthRiskLevel === 'Severe'
                ? 'Severe Heat Stress Danger'
                : advisory.healthRiskLevel === 'High'
                ? 'High Thermal Strain Advisory'
                : 'Moderate Thermal Conditions'}
            </h2>

            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Based on your profile (<strong>{advisory.vulnerabilitySummary}</strong>) and current outdoor WBGT of{' '}
              <strong className="text-red-700 font-mono">{zone.wbgt}°C</strong>, prolonged outdoor exertion carries elevated risk of heat cramps and hyperthermia.
            </p>

            {/* Work-Rest Mandate */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 mt-3">
              <span className="material-symbols-outlined text-amber-700 text-xl mt-0.5">timer</span>
              <div>
                <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider block">
                  Mandatory Work-Rest Protocol
                </span>
                <p className="text-xs text-amber-900 font-bold mt-0.5 leading-relaxed">
                  {advisory.workRestProtocol}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-gray-50 p-4 rounded-xl border border-gray-200/80">
            <div className="bg-white p-3 rounded-lg shadow-2xs border border-gray-200">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Air Temp</span>
              <span className="text-xl font-mono font-extrabold text-gray-900">{zone.temp}°C</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Dry Bulb</span>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-2xs border border-red-200">
              <span className="text-[10px] text-red-600 font-bold uppercase block">Outdoor WBGT</span>
              <span className="text-xl font-mono font-extrabold text-red-700">{zone.wbgt}°C</span>
              <span className="text-[10px] text-red-500 font-bold block mt-0.5">Threshold 32°C</span>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-2xs border border-gray-200">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Humidity</span>
              <span className="text-xl font-mono font-extrabold text-blue-700">{zone.humidity}%</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Relative</span>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-2xs border border-gray-200">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Solar Radiation</span>
              <span className="text-base font-mono font-extrabold text-orange-600">{zone.solarRadiationValue} W/m²</span>
              <span className="text-[10px] text-orange-700 font-semibold block">{zone.solarRad} UV</span>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-2xs border border-gray-200">
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Wind Speed</span>
              <span className="text-xl font-mono font-extrabold text-gray-800">{zone.windSpeed} km/h</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Convective</span>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-2xs border border-purple-200">
              <span className="text-[10px] text-purple-700 font-bold uppercase block">UTCI 'Feels'</span>
              <span className="text-xl font-mono font-extrabold text-purple-800">{zone.utci}°C</span>
              <span className="text-[10px] text-purple-600 block mt-0.5">Biometeorology</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Hydration Quick Tracker & Immediate Precautionary Measures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personalized Hydration Quick Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-2xl">water_drop</span>
                <h3 className="font-bold text-gray-900 text-base">Personalized Hydration Status</h3>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {profile.waterIntakeMl} / {profile.dailyWaterTargetMl} ml
              </span>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Calculated for <strong>{profile.weightKg} kg</strong> in <strong>{zone.wbgt}°C WBGT</strong>. Drink a minimum of 250ml every {hydration.recommendedIntakeIntervalMinutes} minutes.
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1.5">
                <span>Daily Hydration Goal</span>
                <span className="font-mono text-blue-700 font-bold">{waterProgressPercent}% Reached</span>
              </div>
              <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${waterProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0 ml</span>
                <span>Remaining: {Math.max(0, profile.dailyWaterTargetMl - profile.waterIntakeMl)} ml</span>
                <span>{profile.dailyWaterTargetMl} ml</span>
              </div>
            </div>

            {/* Quick Log Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                id="btn-quick-log-250"
                onClick={() => onQuickLogWater(250)}
                className="py-2.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 active:scale-95"
              >
                <span className="material-symbols-outlined text-base">local_drink</span>
                +250ml Glass
              </button>
              <button
                id="btn-quick-log-500"
                onClick={() => onQuickLogWater(500)}
                className="py-2.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 active:scale-95"
              >
                <span className="material-symbols-outlined text-base">water_bottle</span>
                +500ml Bottle
              </button>
              <button
                id="btn-quick-log-750"
                onClick={() => onQuickLogWater(750)}
                className="py-2.5 px-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-950 border border-cyan-200 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 active:scale-95"
              >
                <span className="material-symbols-outlined text-base">medical_services</span>
                +750ml ORS
              </button>
            </div>
          </div>

          <button
            id="btn-open-full-hydration"
            onClick={() => onNavigate('citizen_hydration')}
            className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all text-center"
          >
            Open Full Hydration Tracker & Interval Alarm &rarr;
          </button>
        </div>

        {/* Real-Time Precautionary Measures */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-red-600 text-2xl">health_and_safety</span>
              <h3 className="font-bold text-gray-900 text-base">Immediate Precautionary Actions</h3>
            </div>

            <ul className="space-y-2.5 text-xs text-gray-700">
              {advisory.immediatePrecautions.map((precaution, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="material-symbols-outlined text-emerald-600 text-base mt-0.5">check_circle</span>
                  <span className="leading-relaxed font-medium">{precaution}</span>
                </li>
              ))}
            </ul>

            {/* Warning signs accordion / banner */}
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-xs font-bold text-red-900 block mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                Heat Exhaustion Danger Signs:
              </span>
              <p className="text-[11px] text-red-800 leading-relaxed">
                {advisory.warningSymptoms.join(' • ')}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-medium">Immediate Medical Emergency?</span>
            <a
              href="tel:108"
              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">call</span>
              Dial 108 Ambulance
            </a>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards: Map of Nearby Facilities & Alerts Feed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          id="card-nav-facilities-map"
          onClick={() => onNavigate('citizen_map')}
          className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-2xl text-left transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
              <span className="material-symbols-outlined text-emerald-700">emergency_home</span>
              Find Nearby Cooling & Water Hubs
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Locate open community cooling halls, shaded water kiosks, and emergency triage centers near you.
            </p>
          </div>
          <span className="material-symbols-outlined text-emerald-700 group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>

        <button
          id="card-nav-citizen-alerts"
          onClick={() => onNavigate('citizen_alerts')}
          className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 rounded-2xl text-left transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-base">
              <span className="material-symbols-outlined text-amber-700">campaign</span>
              Real-Time Emergency Alerts Feed
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              View live municipal broadcast advisories, FCM push notices, and heatwave work suspension orders.
            </p>
          </div>
          <span className="material-symbols-outlined text-amber-700 group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
};
