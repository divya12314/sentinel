import React, { useState } from 'react';
import { CityResource, CitizenProfile, WardMetric } from '../../types';
import { InteractiveMap } from '../InteractiveMap';

interface CitizenFacilitiesMapProps {
  resources: CityResource[];
  currentZone: WardMetric;
  profile: CitizenProfile;
  onNavigateBack: () => void;
}

export const CitizenFacilitiesMap: React.FC<CitizenFacilitiesMapProps> = ({
  resources,
  currentZone,
  profile,
  onNavigateBack
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<CityResource | null>(null);
  const [directionModal, setDirectionModal] = useState<string | null>(null);

  // Calculate approximate distance from user's current coordinates
  const enhancedResources = resources.map((res) => {
    const d = Math.sqrt(
      Math.pow(res.lat - currentZone.lat, 2) + Math.pow(res.lng - currentZone.lng, 2)
    ) * 111; // ~111km per degree
    return {
      ...res,
      distanceKm: Math.round(d * 10) / 10
    };
  }).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  const filtered = enhancedResources.filter((res) => {
    if (filterType !== 'all' && res.type !== filterType) return false;
    if (searchQuery && !res.name.toLowerCase().includes(searchQuery.toLowerCase()) && !res.ward.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'cooling_center':
        return 'ac_unit';
      case 'water_station':
        return 'water_drop';
      case 'hospital':
        return 'local_hospital';
      case 'hydration_van':
        return 'local_shipping';
      default:
        return 'location_on';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Optimal':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Near Capacity':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Critical Full':
        return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 transition-all"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">emergency_home</span>
              High Heat Risk Emergency Facilities Finder
            </h1>
            <p className="text-xs text-gray-500">
              Locate open air-cooled community shelters, potable water hydration points, and triage clinics near you.
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold text-gray-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
          <span>{filtered.length} Facilities Active Near {currentZone.name}</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All Facilities', icon: 'grid_view' },
            { id: 'cooling_center', label: 'Cooling Centers', icon: 'ac_unit' },
            { id: 'water_station', label: 'Water Stations', icon: 'water_drop' },
            { id: 'hospital', label: 'Hospitals & Triage', icon: 'local_hospital' },
            { id: 'hydration_van', label: 'Mobile Vans', icon: 'local_shipping' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterType === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-base">search</span>
          <input
            type="text"
            placeholder="Search facility by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Interactive Map Section */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-emerald-600">map</span>
            Live Heat Emergency GIS Map
          </span>
          <span className="text-[11px] text-gray-500">Click marker to view live capacity</span>
        </div>
        <div className="h-80 sm:h-96 rounded-xl overflow-hidden border border-gray-200">
          <InteractiveMap
            zones={[currentZone]}
            selectedZone={currentZone}
            onSelectZone={() => {}}
            resources={filtered}
            hotspots={[]}
            showResourcesOverlay={true}
          />
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((res) => (
          <div
            key={res.id}
            className={`bg-white rounded-2xl p-5 shadow-sm border transition-all flex flex-col justify-between hover:shadow-md ${
              selectedFacility?.id === res.id ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-200'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <span className="material-symbols-outlined text-lg">{getResourceIcon(res.type)}</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 line-clamp-1">{res.name}</h3>
                    <span className="text-[10px] text-gray-500 capitalize">{res.type.replace('_', ' ')} • {res.ward}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(res.status)}`}>
                  {res.status}
                </span>
              </div>

              <p className="text-[11px] text-gray-600 mb-3 flex items-start gap-1.5">
                <span className="material-symbols-outlined text-gray-400 text-xs mt-0.5">location_on</span>
                <span>{res.address}</span>
              </p>

              {/* Occupancy and Distance Stats */}
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200/80 mb-4 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 font-medium">Live Occupancy:</span>
                  <span className="font-mono font-bold text-gray-800">
                    {res.currentOccupancy} / {res.maxCapacity} ({res.capacityPercent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      res.capacityPercent > 90 ? 'bg-red-500' : res.capacityPercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${res.capacityPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 pt-0.5">
                  <span>Distance: <strong className="text-emerald-700 font-bold">{res.distanceKm} km</strong> from you</span>
                  <span>Free Drinking Water & ORS Available</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <a
                href={`tel:${res.contactNumber}`}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                Call Desk
              </a>
              <button
                onClick={() => setDirectionModal(`Opening live routing to ${res.name} (${res.address}). Estimated transit time: ~${Math.max(5, Math.round((res.distanceKm || 1) * 3))} mins.`)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">directions</span>
                Get Directions
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Direction Info Popup */}
      {directionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3 text-emerald-700">
              <span className="material-symbols-outlined text-2xl">navigation</span>
              <h3 className="text-base font-bold text-gray-900">Transit & Shade Route</h3>
            </div>
            <p className="text-xs text-gray-700 mb-4 leading-relaxed">{directionModal}</p>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 mb-4">
              <strong>Heat Travel Precaution:</strong> Walk strictly along shaded tree canopies or transit awnings. Carry an umbrella or cloth over head.
            </div>
            <button
              onClick={() => setDirectionModal(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Close Navigation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
