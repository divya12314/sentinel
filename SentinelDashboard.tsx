import React, { useState } from 'react';
import { WardMetric, NavigationScreen } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { EscalateModal } from './EscalateModal';

interface SentinelDashboardProps {
  zones: WardMetric[];
  selectedZone: WardMetric;
  onSelectZone: (zone: WardMetric) => void;
  onNavigate: (screen: NavigationScreen) => void;
  onAlertTriggered: () => void;
}

export const SentinelDashboard: React.FC<SentinelDashboardProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  onNavigate,
  onAlertTriggered
}) => {
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredZones = zones.filter(z =>
    z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    z.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    z.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/zones/${selectedZone.id}`);
      if (res.ok) {
        const updated = await res.json();
        onSelectZone(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4 flex flex-col gap-4">
      {/* Ward Selector Section */}
      <section className="bg-white border border-[#c6c6cd] rounded-lg p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="material-symbols-outlined text-[#45464d]" data-icon="location_on">
              location_on
            </span>
            <select
              id="ward-selector"
              value={selectedZone.id}
              onChange={(e) => {
                const found = zones.find((z) => z.id === e.target.value);
                if (found) onSelectZone(found);
              }}
              className="bg-transparent border-none text-[16px] text-[#0b1c30] focus:ring-0 p-0 m-0 w-full font-bold cursor-pointer outline-none"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.city})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              title="Refresh live telemetry"
              className={`p-1.5 rounded-full hover:bg-gray-100 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <span className="material-symbols-outlined text-[20px]">sync</span>
            </button>
            <span className="material-symbols-outlined text-[#45464d]" data-icon="search">
              search
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid for Responsive View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Metrics & Urgent Action */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Current Stress Metrics Card */}
          <section className="bg-white border border-[#c6c6cd] rounded-lg p-4 shadow-xs flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#b61722] opacity-10 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>

            <div className="flex justify-between items-start z-10">
              <div>
                <h2 className="text-[12px] font-bold text-[#45464d] uppercase tracking-wider mb-1">
                  CURRENT WBGT
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-[44px] sm:text-[48px] font-black leading-none text-[#0b1c30] tracking-tight">
                    {selectedZone.wbgt}°C
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      selectedZone.wbgt >= 32
                        ? 'bg-red-50 text-[#b61722] border-red-200 animate-pulse'
                        : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}
                  >
                    {selectedZone.riskLevel === 'Critical' ? 'CRITICAL' : selectedZone.riskLevel}
                  </span>
                </div>
              </div>

              {/* Extra stats */}
              <div className="text-right z-10">
                <span className="text-[11px] font-semibold text-gray-500 block">Dry Bulb (Temp)</span>
                <span className="text-[16px] font-bold text-gray-800 font-mono">{selectedZone.temp}°C</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2 border-t border-[#c6c6cd]/40 pt-3 z-10">
              <div>
                <span className="text-[12px] font-bold text-[#45464d] uppercase block mb-1">
                  HUMIDITY
                </span>
                <span className="text-[20px] text-[#0b1c30] font-bold">
                  {selectedZone.humidity}%
                </span>
                <span className="text-[11px] text-gray-500 block mt-0.5">High moisture blocks sweat</span>
              </div>
              <div>
                <span className="text-[12px] font-bold text-[#45464d] uppercase block mb-1">
                  SOLAR RAD
                </span>
                <span className="text-[20px] text-[#b61722] font-bold">
                  {selectedZone.solarRad}
                </span>
                <span className="text-[11px] text-gray-500 block mt-0.5">{selectedZone.solarRadiationValue} W/m²</span>
              </div>
            </div>

            {/* Additional Physiological Row */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-2 text-[11px] text-gray-600 z-10">
              <div className="flex justify-between">
                <span>UTCI Index:</span>
                <span className="font-bold text-gray-900">{selectedZone.utci}°C</span>
              </div>
              <div className="flex justify-between">
                <span>Wind Speed:</span>
                <span className="font-bold text-gray-900">{selectedZone.windSpeed} km/h</span>
              </div>
            </div>
          </section>

          {/* Urgent Action Card */}
          <section className="bg-white border border-[#c6c6cd] border-l-4 border-l-[#b61722] rounded-lg p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-[#b61722] text-2xl"
                data-icon="warning"
                data-weight="fill"
              >
                warning
              </span>
              <span className="text-[16px] font-bold text-[#b61722] uppercase tracking-wide">
                RED ALERT
              </span>
            </div>

            <p className="text-[14px] text-[#45464d] leading-relaxed">
              Mortality Risk{' '}
              <strong className="text-[#b61722] font-bold">
                +{selectedZone.mortalityRiskIncreasePercent}% expected
              </strong>
              . Triggering automated SMS alerts to outdoor workers in {selectedZone.name.split('-')[0].trim()}.
            </p>

            <button
              id="btn-acknowledge-escalate"
              onClick={() => setShowEscalateModal(true)}
              className="bg-[#b61722] hover:bg-red-700 text-white w-full py-3 rounded-lg text-[16px] font-bold shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Acknowledge &amp; Escalate</span>
            </button>
          </section>

          {/* Quick Nav Cards for Desktop / Tablet */}
          <div className="hidden sm:grid grid-cols-3 gap-2">
            <button
              onClick={() => onNavigate('forecast')}
              className="p-3 bg-white hover:bg-gray-50 border border-[#c6c6cd] rounded-lg text-center transition-all group"
            >
              <span className="material-symbols-outlined text-blue-600 mb-1 group-hover:scale-110 transition-transform">
                show_chart
              </span>
              <span className="block text-xs font-bold text-gray-800">Mortality Forecast</span>
            </button>
            <button
              onClick={() => onNavigate('alerts')}
              className="p-3 bg-white hover:bg-gray-50 border border-[#c6c6cd] rounded-lg text-center transition-all group"
            >
              <span className="material-symbols-outlined text-red-600 mb-1 group-hover:scale-110 transition-transform">
                emergency_home
              </span>
              <span className="block text-xs font-bold text-gray-800">Alert Hub</span>
            </button>
            <button
              onClick={() => onNavigate('resources')}
              className="p-3 bg-white hover:bg-gray-50 border border-[#c6c6cd] rounded-lg text-center transition-all group"
            >
              <span className="material-symbols-outlined text-emerald-600 mb-1 group-hover:scale-110 transition-transform">
                map
              </span>
              <span className="block text-xs font-bold text-gray-800">City Resources</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Map Section */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#45464d] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#b61722]">public</span>
              India National Heat Map (Live GIS Layer)
            </h3>
            <span className="text-[11px] text-gray-500">Click any zone pin to switch telemetry</span>
          </div>

          <InteractiveMap
            zones={zones}
            selectedZone={selectedZone}
            onSelectZone={onSelectZone}
            heightClass="h-[320px] sm:h-[380px] lg:h-[460px]"
          />
        </div>
      </div>

      {/* Escalate / Dispatch Modal */}
      <EscalateModal
        zone={selectedZone}
        isOpen={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        onSuccess={() => {
          onAlertTriggered();
        }}
      />
    </div>
  );
};
