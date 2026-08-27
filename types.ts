export type NavigationScreen = 'dashboard' | 'forecast' | 'alerts' | 'resources' | 'matrix' | 'historical' | 'citizen_home' | 'citizen_map' | 'citizen_hydration' | 'citizen_alerts';

export type UserPortalType = 'citizen' | 'admin' | null;

export type RiskLevel = 'Normal' | 'Moderate' | 'High' | 'Severe' | 'Critical';

export type OutdoorExposureLevel = 'high_exposure' | 'moderate_exposure' | 'low_exposure';
export type AgeBracket = 'child' | 'adult' | 'senior';
export type ActivityIntensity = 'sedentary' | 'moderate' | 'heavy_labor';

export interface CitizenProfile {
  id: string;
  email: string;
  age: number;
  weightKg: number;
  outdoorExposure: OutdoorExposureLevel;
  ageBracket: AgeBracket;
  activityIntensity: ActivityIntensity;
  preExistingConditions: string[];
  currentLocationName: string;
  lat: number;
  lng: number;
  dailyWaterTargetMl: number;
  waterIntakeMl: number;
  waterLogs: { time: string; amountMl: number }[];
  fcmPushEnabled: boolean;
  registeredAt: string;
}

export type AdminRole = 
  | 'Disaster Management & Public Health'
  | 'Zonal Executive Officer'
  | 'Emergency Services Response Head';

export interface AdminProfile {
  officialEmail: string;
  departmentRole: AdminRole;
  phone: string;
  isAuthenticated: boolean;
  loginTime: string;
}

export interface WardMetric {
  id: string;
  name: string;
  zone: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  temp: number; // Dry bulb in °C
  humidity: number; // in %
  windSpeed: number; // in km/h
  solarRad: 'Low' | 'Moderate' | 'High' | 'Extreme';
  solarRadiationValue: number; // in W/m²
  wbgt: number; // in °C
  utci: number; // in °C
  htsi: number; // Human Thermal Stress Index 0-100
  riskLevel: RiskLevel;
  mortalityRiskIncreasePercent: number; // e.g. +15%
  hospitalizationSurgePercent: number; // e.g. +28%
  vulnerabilityFactors: {
    elderlyDensityPercent: number; // Age 65+
    outdoorWorkerDensityPercent: number;
    slumHousingDensityPercent: number;
    greenCoverPercent: number;
  };
  advisoryText: string;
  lastUpdated: string;
}

export interface WardActionMatrixRow {
  wardId: string;
  wardName: string;
  zone: string;
  heatRisk: RiskLevel;
  wbgt: number;
  mortalityRisk: number; // e.g. +18%
  hospitalizationSurge: number; // e.g. +32%
  coolingAccessOccupancy: string; // e.g. '85% (340/400)'
  waterStockRemainingLiters: number;
  recommendedAction: string;
  actionStatus: 'Pending' | 'Active' | 'Dispatched';
}

export interface HistoricalYearData {
  year: number;
  peakWbgt: number;
  maxTemp: number;
  heatwaveDays: number;
  excessMortality: number; // percentage surge
  hospitalSurge: number; // admissions surge %
  predType: 'observed' | 'ai_projected';
}

export interface HospitalPreparednessDirective {
  id: string;
  hospitalName: string;
  ward: string;
  ivBagsInStock: number;
  ivBagsRequiredTarget: number;
  heatstrokeBedsAvailable: number;
  heatstrokeBedsTotal: number;
  iceBathTubsAvailable: number;
  triageAlertLevel: 'Code Green' | 'Code Yellow' | 'Code Red';
  statusNotes: string;
  lastDirectiveIssued: string;
}

export interface HeatActionChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'labor' | 'cooling' | 'hospital' | 'water' | 'grid';
  completed: boolean;
  autoTriggeredBy: string;
  priority: 'High' | 'Critical' | 'Medium';
}

export interface ForecastDay {
  dayName: string; // 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  date: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  solarRad: string;
  wbgt: number;
  utci: number;
  htsi: number; // 0 - 100
  mortalityRiskPercent: number; // e.g. 15 for +15%
  hospitalSurgePercent: number;
  riskZone: 'Normal' | 'Moderate' | 'High Risk' | 'Extreme Risk Zone';
}

export interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  zone: string;
  level: 'YELLOW' | 'ORANGE' | 'RED';
  channels: ('SMS' | 'WhatsApp' | 'Sirens' | 'IVR' | 'FCM_Push')[];
  recipientsCount: number;
  status: 'Draft' | 'Issued' | 'Acknowledged' | 'Escalated';
  issuedAt?: string;
  actionTaken?: string;
}

export interface ActiveTrigger {
  id: string;
  name: string;
  triggerCondition: string;
  time: string;
  tags: string[];
  category: 'temperature' | 'water' | 'grid' | 'hospital';
  status: 'Active' | 'Pending' | 'Resolved';
  thresholdValue: string;
}

export interface RecipientSegment {
  id: string;
  name: string;
  coveragePercent: number;
  totalSubscribers: number;
  colorClass: string;
}

export interface CityResource {
  id: string;
  name: string;
  type: 'cooling_center' | 'water_station' | 'hospital' | 'hydration_van';
  ward: string;
  capacityPercent: number;
  currentOccupancy: number;
  maxCapacity: number;
  lat: number;
  lng: number;
  status: 'Optimal' | 'Near Capacity' | 'Critical Full' | 'Standby';
  address: string;
  contactNumber: string;
  distanceKm?: number;
}

export interface HotspotOverlay {
  id: string;
  name: string;
  type: 'slums' | 'industrial' | 'construction' | 'heat_island';
  active: boolean;
  intensity: 'Medium' | 'High' | 'Extreme';
  coordinates: [number, number][];
}

