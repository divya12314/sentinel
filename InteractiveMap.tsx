import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { WardMetric, CityResource, HotspotOverlay } from '../types';

interface InteractiveMapProps {
  zones: WardMetric[];
  selectedZone: WardMetric | null;
  onSelectZone: (zone: WardMetric) => void;
  resources?: CityResource[];
  hotspots?: HotspotOverlay[];
  heightClass?: string;
  showResources?: boolean;
  showHotspots?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  resources = [],
  hotspots = [],
  heightClass = 'h-64 sm:h-80 md:h-96',
  showResources = false,
  showHotspots = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [mapLayerType, setMapLayerType] = useState<'satellite' | 'tactical' | 'street'>('satellite');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered on India or current zone
      const initialLat = selectedZone ? selectedZone.lat : 22.5;
      const initialLng = selectedZone ? selectedZone.lng : 78.5;
      const initialZoom = selectedZone ? 9 : 5;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false
      });

      // Add default tile layer (Satellite)
      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      );
      satelliteLayer.addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    if (mapLayerType === 'tactical') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (mapLayerType === 'street') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }

    L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(map);
  }, [mapLayerType]);

  // Center on Selected Zone
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedZone) return;

    map.flyTo([selectedZone.lat, selectedZone.lng], 10, {
      duration: 1.2
    });
  }, [selectedZone?.id]);

  // Draw Heatmap Circles & Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. National Heat Zones across India
    zones.forEach((z) => {
      const isSelected = selectedZone?.id === z.id;
      const isCritical = z.wbgt >= 33.5 || z.temp >= 40;
      const radius = isSelected ? 38000 : 25000;
      const fillColor = isCritical ? '#da3437' : '#f97316';

      // Outer heat glow
      const heatCircleGlow = L.circle([z.lat, z.lng], {
        radius: radius * 1.8,
        color: fillColor,
        fillColor: fillColor,
        fillOpacity: 0.25,
        weight: 0
      });
      heatCircleGlow.addTo(layerGroup);

      // Core heat circle
      const heatCircle = L.circle([z.lat, z.lng], {
        radius: radius,
        color: isSelected ? '#ffffff' : fillColor,
        fillColor: fillColor,
        fillOpacity: 0.65,
        weight: isSelected ? 3 : 1
      });

      heatCircle.on('click', () => {
        onSelectZone(z);
      });

      // Custom Marker Popup
      const customIcon = L.divIcon({
        className: 'custom-heat-pin',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="w-7 h-7 rounded-full ${isCritical ? 'bg-red-600 ring-4 ring-red-400/50 animate-pulse' : 'bg-orange-500 ring-2 ring-orange-300'} flex items-center justify-center text-white shadow-xl text-[11px] font-black font-mono">
              ${Math.round(z.wbgt)}°
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap bg-gray-900/90 text-white px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight shadow">
              ${z.name.split('-')[0]}
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([z.lat, z.lng], { icon: customIcon });
      marker.on('click', () => onSelectZone(z));
      marker.addTo(layerGroup);
      heatCircle.addTo(layerGroup);
    });

    // 2. Hotspots (Slums / Industrial)
    if (showHotspots && hotspots.length > 0) {
      hotspots.filter(h => h.active).forEach((h) => {
        const polygon = L.polygon(h.coordinates, {
          color: h.type === 'slums' ? '#ef4444' : '#eab308',
          fillColor: h.type === 'slums' ? '#ef4444' : '#eab308',
          fillOpacity: 0.35,
          weight: 2,
          dashArray: '4, 4'
        });
        polygon.bindPopup(`
          <div class="p-2">
            <strong class="text-xs text-red-600 block uppercase">${h.name}</strong>
            <span class="text-[11px] text-gray-600">Thermal Vulnerability: ${h.intensity}</span>
          </div>
        `);
        polygon.addTo(layerGroup);
      });
    }

    // 3. City Resources (Cooling centers, Water, Hospitals)
    if (showResources && resources.length > 0) {
      resources.forEach((res) => {
        let iconSymbol = 'ac_unit';
        let bgBadge = 'bg-blue-600';
        if (res.type === 'water_station' || res.type === 'hydration_van') {
          iconSymbol = 'water_drop';
          bgBadge = 'bg-cyan-600';
        } else if (res.type === 'hospital') {
          iconSymbol = 'local_hospital';
          bgBadge = 'bg-red-600';
        }

        const isFull = res.capacityPercent >= 85;
        const resIcon = L.divIcon({
          className: 'custom-resource-pin',
          html: `
            <div class="relative group cursor-pointer flex flex-col items-center">
              <div class="w-8 h-8 rounded-full ${bgBadge} ${isFull ? 'ring-4 ring-red-400 animate-bounce' : 'ring-2 ring-white'} text-white flex items-center justify-center shadow-lg">
                <span class="material-symbols-outlined text-[16px]">${iconSymbol}</span>
              </div>
              <div class="bg-gray-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow mt-0.5 whitespace-nowrap">
                ${res.capacityPercent}%
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const resMarker = L.marker([res.lat, res.lng], { icon: resIcon });
        resMarker.bindPopup(`
          <div class="p-2 font-sans">
            <div class="text-xs font-bold text-gray-900">${res.name}</div>
            <div class="text-[11px] text-gray-600">${res.address}</div>
            <div class="mt-2 flex items-center justify-between text-xs font-semibold">
              <span>Occupancy:</span>
              <span class="${isFull ? 'text-red-600 font-bold' : 'text-gray-900'}">${res.capacityPercent}% (${res.currentOccupancy}/${res.maxCapacity})</span>
            </div>
            <div class="text-[10px] text-blue-600 font-mono mt-1">Tel: ${res.contactNumber}</div>
          </div>
        `);
        resMarker.addTo(layerGroup);
      });
    }
  }, [zones, selectedZone?.id, resources, hotspots, showResources, showHotspots]);

  const toggleLayer = () => {
    if (mapLayerType === 'satellite') setMapLayerType('tactical');
    else if (mapLayerType === 'tactical') setMapLayerType('street');
    else setMapLayerType('satellite');
  };

  return (
    <section className={`mt-4 rounded-lg overflow-hidden border border-[#c6c6cd] shadow-sm relative ${heightClass} bg-[#dce9ff]`}>
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* Map Legend Overlay UI matching exact design */}
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 z-10 pointer-events-auto">
        <div className="bg-[#ffffff]/90 backdrop-blur px-2.5 py-1 border border-[#c6c6cd] rounded text-[10px] font-bold text-[#0b1c30] uppercase flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
          HIGH INTENSITY
        </div>
        <div className="bg-[#ffffff]/90 backdrop-blur px-2.5 py-1 border border-[#c6c6cd] rounded text-[10px] font-bold text-[#0b1c30] uppercase flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#b61722] inline-block animate-ping"></span>
          CRITICAL HEAT
        </div>
      </div>

      {/* Layer Switcher Button */}
      <button
        onClick={toggleLayer}
        title={`Current: ${mapLayerType} (Click to switch)`}
        className="absolute top-2 right-2 bg-[#ffffff] hover:bg-gray-100 p-2 rounded border border-[#c6c6cd] shadow-md z-10 transition-transform active:scale-95 flex items-center gap-1 text-xs font-semibold text-[#0b1c30]"
      >
        <span className="material-symbols-outlined text-[18px] text-[#0b1c30]" data-icon="layers">layers</span>
        <span className="hidden sm:inline capitalize text-[11px]">{mapLayerType}</span>
      </button>

      {/* Zoom / Reset View */}
      <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-7 h-7 bg-white hover:bg-gray-100 rounded border border-[#c6c6cd] shadow flex items-center justify-center font-bold text-gray-700 text-sm active:scale-95"
        >
          +
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-7 h-7 bg-white hover:bg-gray-100 rounded border border-[#c6c6cd] shadow flex items-center justify-center font-bold text-gray-700 text-sm active:scale-95"
        >
          -
        </button>
      </div>
    </section>
  );
};
