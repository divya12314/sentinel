import React, { useState, useEffect } from 'react';
import { WardMetric, CityResource, HotspotOverlay } from '../types';
import { InteractiveMap } from './InteractiveMap';

interface CityResourcesProps {
  selectedZone: WardMetric;
  zones: WardMetric[];
  onSelectZone: (zone: WardMetric) => void;
}

export const CityResources: React.FC<CityResourcesProps> = ({
  selectedZone,
  zones,
  onSelectZone
}) => {
  const [resources, setResources] = useState<CityResource[]>([]);
  const [hotspots, setHotspots] = useState<HotspotOverlay[]>([]);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchType, setDispatchType] = useState<'water' | 'cooling'>('water');
  const [dispatchWard, setDispatchWard] = useState('Ward 12');
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'reports' | 'contacts' | 'settings' | 'help'>('overview');
  const [isDispatching, setIsDispatching] = useState(false);

  useEffect(() => {
    async function loadResources() {
      try {
        const res = await fetch('/api/resources');
        if (res.ok) {
          const data = await res.json();
          setResources(data.resources);
          setHotspots(data.hotspots);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadResources();
  }, []);

  const toggleHotspot = (id: string) => {
    setHotspots(hotspots.map(h => h.id === id ? { ...h, active: !h.active } : h));
  };

  const handleDispatchResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    try {
      const res = await fetch('/api/resources/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: dispatchType, ward: dispatchWard })
      });
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources);
        setShowDispatchModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col md:flex-row w-full max-w-[1440px] mx-auto h-[calc(100vh-4rem-4.5rem)] relative overflow-hidden bg-[#f8f9ff]">
      {/* Desktop Sidebar (Sentinel Admin Drawer) */}
      <nav className="bg-[#eff4ff] h-full w-72 border-r border-[#c6c6cd] shadow-xs hidden lg:flex flex-col shrink-0">
        <div className="p-5 border-b border-[#c6c6cd]">
          <h2 className="text-[20px] font-bold text-[#0b1c30] tracking-tight">
            Sentinel Admin
          </h2>
          <p className="text-[12px] text-[#45464d] mt-0.5">Municipal Heat Action Grid</p>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors text-[14px] font-medium text-left ${
              activeAdminTab === 'overview'
                ? 'bg-[#131b2e] text-white font-bold'
                : 'text-[#45464d] hover:bg-[#dce9ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="location_city">
              location_city
            </span>
            <span>City Overview</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('reports')}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors text-[14px] font-medium text-left ${
              activeAdminTab === 'reports'
                ? 'bg-[#131b2e] text-white font-bold'
                : 'text-[#45464d] hover:bg-[#dce9ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="analytics">
              analytics
            </span>
            <span>Ward Reports</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('contacts')}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors text-[14px] font-medium text-left ${
              activeAdminTab === 'contacts'
                ? 'bg-[#131b2e] text-white font-bold'
                : 'text-[#45464d] hover:bg-[#dce9ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="contact_phone">
              contact_phone
            </span>
            <span>Agency Contacts</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('settings')}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors text-[14px] font-medium text-left ${
              activeAdminTab === 'settings'
                ? 'bg-[#131b2e] text-white font-bold'
                : 'text-[#45464d] hover:bg-[#dce9ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="settings">
              settings
            </span>
            <span>Protocol Settings</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('help')}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors text-[14px] font-medium text-left ${
              activeAdminTab === 'help'
                ? 'bg-[#131b2e] text-white font-bold'
                : 'text-[#45464d] hover:bg-[#dce9ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="help">
              help
            </span>
            <span>Help Center</span>
          </button>
        </div>

        {/* Live System Telemetry Status */}
        <div className="p-4 border-t border-[#c6c6cd] text-[11px] text-[#45464d] bg-white">
          <div className="flex justify-between items-center mb-1">
            <span>Grid Load State:</span>
            <span className="font-bold text-green-700">OPTIMAL</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Hydration Fleet:</span>
            <span className="font-bold text-blue-700">12 Active Vans</span>
          </div>
        </div>
      </nav>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col md:flex-row h-full relative overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative w-full h-[60%] md:h-full bg-[#d3e4fe] overflow-hidden">
          <InteractiveMap
            zones={zones}
            selectedZone={selectedZone}
            onSelectZone={onSelectZone}
            resources={resources}
            hotspots={hotspots}
            showResources={true}
            showHotspots={true}
            heightClass="h-full"
          />

          {/* Map Overlay Controls (Hotspot Overlays) */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="bg-white p-3 rounded-lg border border-[#c6c6cd] shadow-lg pointer-events-auto flex flex-col gap-2.5 w-52">
              <span className="text-[11px] font-bold text-[#45464d] uppercase tracking-wider">
                Hotspot Overlays
              </span>

              {hotspots.map((h) => (
                <label key={h.id} className="flex items-center justify-between cursor-pointer group select-none">
                  <span className="text-[13px] text-[#0b1c30] group-hover:text-black font-medium">
                    {h.name}
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={h.active}
                      onChange={() => toggleHotspot(h.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#b61722]"></div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Emergency FAB button */}
          <button
            id="fab-emergency"
            onClick={() => setShowDispatchModal(true)}
            className="absolute bottom-6 right-6 w-14 h-14 bg-[#b61722] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-red-700 transition-transform active:scale-95 z-20 focus:outline-none focus:ring-4 focus:ring-red-400 cursor-pointer"
            title="Dispatch Emergency Units"
          >
            <span className="material-symbols-outlined text-2xl" data-icon="emergency">
              emergency
            </span>
          </button>
        </div>

        {/* Draggable / Scrollable Data Drawer */}
        <div className="h-[40%] md:h-full md:w-84 bg-white border-t md:border-t-0 md:border-l border-[#c6c6cd] shadow-lg flex flex-col z-20 overflow-hidden">
          <div className="w-full flex justify-center py-2 md:hidden">
            <div className="w-12 h-1.5 bg-[#c6c6cd] rounded-full"></div>
          </div>

          <div className="p-4 border-b border-[#c6c6cd] flex justify-between items-center bg-[#f8f9ff]">
            <div>
              <h3 className="text-[18px] font-bold text-[#0b1c30]">Capacity Indicators</h3>
              <p className="text-[11px] text-[#45464d]">Real-time municipal resource stress</p>
            </div>
            <span className="text-[10px] font-bold text-[#45464d] bg-[#dce9ff] px-2 py-1 rounded uppercase tracking-wider">
              Live
            </span>
          </div>

          {/* Capacity List matching exact screen */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Ward 7 */}
            <div className="flex flex-col gap-1 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
              <div className="flex justify-between items-end">
                <span className="text-[14px] font-bold text-[#0b1c30]">Ward 7</span>
                <span className="text-[14px] text-[#ba1a1a] font-black font-mono">85% Full</span>
              </div>
              <div className="w-full bg-[#d3e4fe] rounded-full h-2 mt-1 overflow-hidden">
                <div className="bg-[#b61722] h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <span className="text-[11px] font-semibold text-[#45464d] mt-1">
                Cooling Centers (340/400 occupants)
              </span>
            </div>

            {/* Ward 12 */}
            <div className="flex flex-col gap-1 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
              <div className="flex justify-between items-end">
                <span className="text-[14px] font-bold text-[#0b1c30]">Ward 12</span>
                <span className="text-[14px] text-[#000000] font-black font-mono">62% Full</span>
              </div>
              <div className="w-full bg-[#d3e4fe] rounded-full h-2 mt-1 overflow-hidden">
                <div className="bg-[#000000] h-2 rounded-full" style={{ width: '62%' }}></div>
              </div>
              <span className="text-[11px] font-semibold text-[#45464d] mt-1">
                Water Stations (6,200/10,000 L delivered)
              </span>
            </div>

            {/* Ward 3 */}
            <div className="flex flex-col gap-1 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
              <div className="flex justify-between items-end">
                <span className="text-[14px] font-bold text-[#0b1c30]">Ward 3</span>
                <span className="text-[14px] text-[#ba1a1a] font-black font-mono">92% Full</span>
              </div>
              <div className="w-full bg-[#d3e4fe] rounded-full h-2 mt-1 overflow-hidden">
                <div className="bg-[#b61722] h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
              <span className="text-[11px] font-semibold text-[#45464d] mt-1">
                Emergency Hospitals (276/300 beds occupied)
              </span>
            </div>

            {/* Quick Action in drawer */}
            <div className="pt-2">
              <button
                onClick={() => setShowDispatchModal(true)}
                className="w-full py-2 px-3 bg-[#131b2e] hover:bg-black text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">local_shipping</span>
                Dispatch Extra Hydration Tankers
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="bg-[#131b2e] text-white px-5 py-3.5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400">emergency</span>
                <h3 className="font-bold text-sm uppercase">Dispatch Emergency Resource</h3>
              </div>
              <button onClick={() => setShowDispatchModal(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleDispatchResource} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Resource Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDispatchType('water')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 ${
                      dispatchType === 'water' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">water_drop</span>
                    Hydration Tanker
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchType('cooling')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 ${
                      dispatchType === 'cooling' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">ac_unit</span>
                    Mobile Cooling Hub
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Target Ward</label>
                <select
                  value={dispatchWard}
                  onChange={(e) => setDispatchWard(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-gray-300 font-bold"
                >
                  <option value="Ward 12">Ward 12 (West Zone)</option>
                  <option value="Ward 7">Ward 7 (East Zone)</option>
                  <option value="Ward 3">Ward 3 (South Zone)</option>
                  <option value="Ward 4">Ward 4 (North Zone)</option>
                  <option value="Ward 1">Ward 1 (Central)</option>
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-lg text-[11px]">
                Target will receive automatic SMS confirmation and GPS driver routing within 3 minutes.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-4 py-2 bg-[#b61722] hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs active:scale-95"
                >
                  {isDispatching ? 'Routing...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
