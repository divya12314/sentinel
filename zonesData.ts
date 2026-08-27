import { WardMetric, ActiveTrigger, RecipientSegment, CityResource, HotspotOverlay } from '../types';
import { calculateOutdoorWBGT, calculateUTCI, calculateHTSI, getWBGTRiskLevel, predictMortalityAndHospitalSurge } from '../utils/thermalStress';

export interface ZoneConfig {
  id: string;
  name: string;
  zone: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  elderlyDensityPercent: number;
  outdoorWorkerDensityPercent: number;
  slumHousingDensityPercent: number;
  greenCoverPercent: number;
}

export const INITIAL_ZONES: ZoneConfig[] = [
  {
    id: 'ward-12-west',
    name: 'Ward 12 - West Zone',
    zone: 'West Zone',
    city: 'Ahmedabad',
    state: 'Gujarat',
    lat: 23.0338,
    lng: 72.5467,
    elderlyDensityPercent: 16.4,
    outdoorWorkerDensityPercent: 38.2,
    slumHousingDensityPercent: 42.0,
    greenCoverPercent: 8.5
  },
  {
    id: 'ward-1-central',
    name: 'Ward 1 - Central',
    zone: 'Central Zone',
    city: 'Delhi NCR',
    state: 'Delhi',
    lat: 28.6139,
    lng: 77.2090,
    elderlyDensityPercent: 18.2,
    outdoorWorkerDensityPercent: 34.5,
    slumHousingDensityPercent: 31.0,
    greenCoverPercent: 14.2
  },
  {
    id: 'ward-4-north',
    name: 'Ward 4 - North',
    zone: 'North Zone',
    city: 'Nagpur',
    state: 'Maharashtra',
    lat: 21.1458,
    lng: 79.0882,
    elderlyDensityPercent: 14.8,
    outdoorWorkerDensityPercent: 41.0,
    slumHousingDensityPercent: 39.5,
    greenCoverPercent: 11.0
  },
  {
    id: 'ward-7-east',
    name: 'Ward 7 - East Zone',
    zone: 'East Zone',
    city: 'Kolkata',
    state: 'West Bengal',
    lat: 22.5726,
    lng: 88.3639,
    elderlyDensityPercent: 19.5,
    outdoorWorkerDensityPercent: 35.0,
    slumHousingDensityPercent: 46.8,
    greenCoverPercent: 7.2
  },
  {
    id: 'ward-3-south',
    name: 'Ward 3 - South Zone',
    zone: 'South Zone',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.3850,
    lng: 78.4867,
    elderlyDensityPercent: 13.5,
    outdoorWorkerDensityPercent: 36.4,
    slumHousingDensityPercent: 28.0,
    greenCoverPercent: 12.8
  },
  {
    id: 'zone-mumbai-suburb',
    name: 'Ward 9 - Coastal Suburban',
    zone: 'Suburban Zone',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0760,
    lng: 72.8777,
    elderlyDensityPercent: 15.1,
    outdoorWorkerDensityPercent: 33.0,
    slumHousingDensityPercent: 52.3,
    greenCoverPercent: 9.1
  },
  {
    id: 'zone-jaipur-west',
    name: 'Ward 6 - Arid North-West',
    zone: 'North-West Zone',
    city: 'Jaipur',
    state: 'Rajasthan',
    lat: 26.9124,
    lng: 75.7873,
    elderlyDensityPercent: 15.9,
    outdoorWorkerDensityPercent: 44.0,
    slumHousingDensityPercent: 33.2,
    greenCoverPercent: 6.4
  }
];

export const INITIAL_ACTIVE_TRIGGERS: ActiveTrigger[] = [
  {
    id: 'trig-1',
    name: 'West Zone Heatwave',
    triggerCondition: 'Trigger: Temp > 40°C & WBGT > 32°C',
    time: '11:00 AM',
    tags: ['Construction', 'Schools'],
    category: 'temperature',
    status: 'Active',
    thresholdValue: '> 40°C'
  },
  {
    id: 'trig-2',
    name: 'North Ward Water Advisory',
    triggerCondition: 'Trigger: Reservoir < 20%',
    time: 'Pending',
    tags: ['Residents'],
    category: 'water',
    status: 'Pending',
    thresholdValue: '< 20%'
  },
  {
    id: 'trig-3',
    name: 'Hospital Surge Pre-Alert',
    triggerCondition: 'Trigger: Heatstroke triage admissions > 25/day',
    time: '02:30 PM',
    tags: ['Hospitals', 'Emergency'],
    category: 'hospital',
    status: 'Active',
    thresholdValue: '> 25 adm.'
  }
];

export const INITIAL_RECIPIENT_SEGMENTS: RecipientSegment[] = [
  {
    id: 'seg-1',
    name: 'Outdoor Workers',
    coveragePercent: 85,
    totalSubscribers: 42800,
    colorClass: 'bg-[#da3437]'
  },
  {
    id: 'seg-2',
    name: 'Healthcare Admin',
    coveragePercent: 100,
    totalSubscribers: 3450,
    colorClass: 'bg-[#131b2e]'
  },
  {
    id: 'seg-3',
    name: 'Vulnerable Residents',
    coveragePercent: 62,
    totalSubscribers: 118400,
    colorClass: 'bg-[#4edea3]'
  }
];

export const INITIAL_CITY_RESOURCES: CityResource[] = [
  {
    id: 'res-1',
    name: 'Ward 7 Community Cooling Hub',
    type: 'cooling_center',
    ward: 'Ward 7',
    capacityPercent: 85,
    currentOccupancy: 340,
    maxCapacity: 400,
    lat: 22.5746,
    lng: 88.3689,
    status: 'Near Capacity',
    address: 'East End Civic Center, Sector 3',
    contactNumber: '+91 33 2445 8891'
  },
  {
    id: 'res-2',
    name: 'Ward 12 Water Hydration Station A',
    type: 'water_station',
    ward: 'Ward 12',
    capacityPercent: 62,
    currentOccupancy: 6200,
    maxCapacity: 10000,
    lat: 23.0368,
    lng: 72.5487,
    status: 'Optimal',
    address: 'West Zone Transport Depot Junction',
    contactNumber: '+91 79 2658 1120'
  },
  {
    id: 'res-3',
    name: 'Ward 3 General & Trauma Hospital',
    type: 'hospital',
    ward: 'Ward 3',
    capacityPercent: 92,
    currentOccupancy: 276,
    maxCapacity: 300,
    lat: 17.3890,
    lng: 78.4910,
    status: 'Critical Full',
    address: 'South Zone Health Complex, Ward 3',
    contactNumber: '+91 40 2344 9900'
  },
  {
    id: 'res-4',
    name: 'Ward 12 Community Hall Cooling Center',
    type: 'cooling_center',
    ward: 'Ward 12',
    capacityPercent: 78,
    currentOccupancy: 234,
    maxCapacity: 300,
    lat: 23.0318,
    lng: 72.5427,
    status: 'Optimal',
    address: 'Near Shivalik Plaza, Ward 12',
    contactNumber: '+91 79 2744 3321'
  },
  {
    id: 'res-5',
    name: 'Ward 4 Mobile Hydration Fleet #3',
    type: 'hydration_van',
    ward: 'Ward 4',
    capacityPercent: 45,
    currentOccupancy: 450,
    maxCapacity: 1000,
    lat: 21.1478,
    lng: 79.0852,
    status: 'Optimal',
    address: 'North Industrial Belt Route',
    contactNumber: '+91 712 256 7788'
  }
];

export const INITIAL_HOTSPOTS: HotspotOverlay[] = [
  {
    id: 'hotspot-slums',
    name: 'High-Density Slums',
    type: 'slums',
    active: true,
    intensity: 'Extreme',
    coordinates: [
      [23.035, 72.540],
      [23.039, 72.552],
      [23.028, 72.549],
      [23.025, 72.538]
    ]
  },
  {
    id: 'hotspot-industrial',
    name: 'Industrial Zones',
    type: 'industrial',
    active: false,
    intensity: 'High',
    coordinates: [
      [23.050, 72.520],
      [23.058, 72.535],
      [23.045, 72.540],
      [23.038, 72.525]
    ]
  }
];
