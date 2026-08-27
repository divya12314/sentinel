import {
  WardActionMatrixRow,
  HistoricalYearData,
  HospitalPreparednessDirective,
  HeatActionChecklistItem,
  CitizenProfile,
  AdminProfile
} from '../types';

export const DEFAULT_CITIZEN_PROFILE: CitizenProfile = {
  id: 'cit-001',
  email: 'ramesh.kumar@worker.in',
  age: 38,
  weightKg: 68,
  outdoorExposure: 'high_exposure',
  ageBracket: 'adult',
  activityIntensity: 'heavy_labor',
  preExistingConditions: ['Mild Hypertension'],
  currentLocationName: 'Ward 12 - West Zone (Ahmedabad)',
  lat: 23.0338,
  lng: 72.5467,
  dailyWaterTargetMl: 4200,
  waterIntakeMl: 1750,
  waterLogs: [
    { time: '08:15 AM', amountMl: 500 },
    { time: '10:30 AM', amountMl: 500 },
    { time: '12:15 PM', amountMl: 750 }
  ],
  fcmPushEnabled: true,
  registeredAt: new Date().toISOString()
};

export const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  officialEmail: 'officer.deshmukh@gcc.gov.in',
  departmentRole: 'Disaster Management & Public Health',
  phone: '+91 98201 45678',
  isAuthenticated: true,
  loginTime: new Date().toISOString()
};

export const INITIAL_WARD_ACTION_MATRIX: WardActionMatrixRow[] = [
  {
    wardId: 'ward-12-west',
    wardName: 'Ward 12 - West Zone',
    zone: 'West Zone',
    heatRisk: 'Critical',
    wbgt: 34.5,
    mortalityRisk: 18.4,
    hospitalizationSurge: 34.0,
    coolingAccessOccupancy: '78% (234/300)',
    waterStockRemainingLiters: 14500,
    recommendedAction: 'Halt outdoor construction; dispatch 3 water tankers; open Sector 12 Cooling Hub.',
    actionStatus: 'Active'
  },
  {
    wardId: 'ward-1-central',
    wardName: 'Ward 1 - Central',
    zone: 'Central Zone',
    heatRisk: 'Severe',
    wbgt: 33.2,
    mortalityRisk: 14.2,
    hospitalizationSurge: 26.5,
    coolingAccessOccupancy: '88% (352/400)',
    waterStockRemainingLiters: 9200,
    recommendedAction: 'Deploy mobile shade canopies at bus terminals; alert LNJP triage beds.',
    actionStatus: 'Active'
  },
  {
    wardId: 'ward-4-north',
    wardName: 'Ward 4 - North',
    zone: 'North Zone',
    heatRisk: 'Critical',
    wbgt: 34.8,
    mortalityRisk: 22.0,
    hospitalizationSurge: 41.2,
    coolingAccessOccupancy: '95% (285/300)',
    waterStockRemainingLiters: 6500,
    recommendedAction: 'Emergency water tanker replenishment; alert 108 ambulance fleet.',
    actionStatus: 'Pending'
  },
  {
    wardId: 'ward-7-east',
    wardName: 'Ward 7 - East Zone',
    zone: 'East Zone',
    heatRisk: 'Severe',
    wbgt: 33.8,
    mortalityRisk: 16.5,
    hospitalizationSurge: 29.0,
    coolingAccessOccupancy: '85% (340/400)',
    waterStockRemainingLiters: 11000,
    recommendedAction: 'Coordinate high-density slum misting guns; broadcast SMS advisory.',
    actionStatus: 'Active'
  },
  {
    wardId: 'ward-3-south',
    wardName: 'Ward 3 - South Zone',
    zone: 'South Zone',
    heatRisk: 'High',
    wbgt: 31.9,
    mortalityRisk: 9.8,
    hospitalizationSurge: 18.0,
    coolingAccessOccupancy: '62% (186/300)',
    waterStockRemainingLiters: 18000,
    recommendedAction: 'Pre-position ORS packets at urban health primary centers.',
    actionStatus: 'Dispatched'
  },
  {
    wardId: 'zone-mumbai-suburb',
    wardName: 'Ward 9 - Coastal Suburban',
    zone: 'Suburban Zone',
    heatRisk: 'Severe',
    wbgt: 33.6,
    mortalityRisk: 15.0,
    hospitalizationSurge: 31.0,
    coolingAccessOccupancy: '91% (273/300)',
    waterStockRemainingLiters: 7800,
    recommendedAction: 'High humidity caution; mandate hourly hydration at rail construction sites.',
    actionStatus: 'Pending'
  },
  {
    wardId: 'zone-jaipur-west',
    wardName: 'Ward 6 - Arid North-West',
    zone: 'North-West Zone',
    heatRisk: 'Critical',
    wbgt: 35.1,
    mortalityRisk: 24.5,
    hospitalizationSurge: 44.0,
    coolingAccessOccupancy: '82% (246/300)',
    waterStockRemainingLiters: 5200,
    recommendedAction: 'Code Red Heatwave Directive: emergency mobile clinic deployment.',
    actionStatus: 'Pending'
  }
];

export const INITIAL_HISTORICAL_DATA: Record<string, HistoricalYearData[]> = {
  'ward-12-west': [
    { year: 2019, peakWbgt: 32.1, maxTemp: 42.0, heatwaveDays: 8, excessMortality: 7.5, hospitalSurge: 14.0, predType: 'observed' },
    { year: 2020, peakWbgt: 31.8, maxTemp: 41.5, heatwaveDays: 6, excessMortality: 6.0, hospitalSurge: 11.5, predType: 'observed' },
    { year: 2021, peakWbgt: 33.0, maxTemp: 43.2, heatwaveDays: 11, excessMortality: 11.2, hospitalSurge: 21.0, predType: 'observed' },
    { year: 2022, peakWbgt: 33.9, maxTemp: 44.8, heatwaveDays: 16, excessMortality: 15.8, hospitalSurge: 28.5, predType: 'observed' },
    { year: 2023, peakWbgt: 34.2, maxTemp: 45.1, heatwaveDays: 18, excessMortality: 17.2, hospitalSurge: 31.0, predType: 'observed' },
    { year: 2024, peakWbgt: 34.6, maxTemp: 46.0, heatwaveDays: 21, excessMortality: 19.5, hospitalSurge: 36.8, predType: 'observed' },
    { year: 2025, peakWbgt: 34.8, maxTemp: 46.4, heatwaveDays: 23, excessMortality: 20.8, hospitalSurge: 38.0, predType: 'observed' },
    { year: 2026, peakWbgt: 35.2, maxTemp: 47.1, heatwaveDays: 26, excessMortality: 24.5, hospitalSurge: 44.5, predType: 'ai_projected' }
  ]
};

export const INITIAL_HOSPITAL_DIRECTIVES: HospitalPreparednessDirective[] = [
  {
    id: 'hosp-dir-1',
    hospitalName: 'VS Municipal General Hospital',
    ward: 'Ward 12 - West Zone',
    ivBagsInStock: 850,
    ivBagsRequiredTarget: 1500,
    heatstrokeBedsAvailable: 12,
    heatstrokeBedsTotal: 40,
    iceBathTubsAvailable: 4,
    triageAlertLevel: 'Code Red',
    statusNotes: 'High volume of outdoor laborer heat exhaustion admissions. Requesting 650 additional Normal Saline (0.9%) IV infusion units.',
    lastDirectiveIssued: '10:30 AM'
  },
  {
    id: 'hosp-dir-2',
    hospitalName: 'Civil Emergency Trauma Center',
    ward: 'Ward 1 - Central',
    ivBagsInStock: 1200,
    ivBagsRequiredTarget: 1800,
    heatstrokeBedsAvailable: 18,
    heatstrokeBedsTotal: 50,
    iceBathTubsAvailable: 6,
    triageAlertLevel: 'Code Yellow',
    statusNotes: 'Triage team active. Cooling immersion tubs operational. Backup cold storage generator verified.',
    lastDirectiveIssued: '09:45 AM'
  },
  {
    id: 'hosp-dir-3',
    hospitalName: 'Government Medical College Hospital',
    ward: 'Ward 4 - North',
    ivBagsInStock: 420,
    ivBagsRequiredTarget: 1200,
    heatstrokeBedsAvailable: 5,
    heatstrokeBedsTotal: 30,
    iceBathTubsAvailable: 2,
    triageAlertLevel: 'Code Red',
    statusNotes: 'CRITICAL SHORTAGE: Pediatric and geriatric heat stress surge. Emergency IV fluid replenishment dispatched.',
    lastDirectiveIssued: '11:15 AM'
  }
];

export const INITIAL_HEAT_ACTION_CHECKLIST: HeatActionChecklistItem[] = [
  {
    id: 'hap-1',
    title: 'Halt Outdoor Labor (11:00 AM - 4:00 PM)',
    description: 'Issue municipal stop-work order to all construction sites, brick kilns, and street hawker zones during peak solar radiation.',
    category: 'labor',
    completed: true,
    autoTriggeredBy: 'AI Trigger: WBGT > 33.5°C threshold breached',
    priority: 'Critical'
  },
  {
    id: 'hap-2',
    title: 'Open All Municipal Air-Cooled Facilities',
    description: 'Unlock community halls, libraries, and temples as designated public cooling shelters with free potable water and ORS sachets.',
    category: 'cooling',
    completed: true,
    autoTriggeredBy: 'AI Trigger: Thermal Stress Index (HTSI) > 85',
    priority: 'Critical'
  },
  {
    id: 'hap-3',
    title: 'Alert Hospitals: Pre-stock IV Saline & Rapid Cooling Units',
    description: 'Ensure 1,500+ Normal Saline IV units in stock per ward hospital and reserve minimum 30 dedicated heatstroke beds.',
    category: 'hospital',
    completed: true,
    autoTriggeredBy: 'AI Trigger: Predicted Mortality Surge > 15%',
    priority: 'Critical'
  },
  {
    id: 'hap-4',
    title: 'Deploy Municipal Potable Water Tanker Fleet',
    description: 'Dispatch high-capacity water tankers to high-density slum clusters and major public transit junctions.',
    category: 'water',
    completed: false,
    autoTriggeredBy: 'AI Trigger: Slum thermal vulnerability overlay active',
    priority: 'High'
  },
  {
    id: 'hap-5',
    title: 'Schedule Power Grid Surge Protection',
    description: 'Coordinate with State Electricity Board to prevent transformer trips and prioritize hospital feeder lines.',
    category: 'grid',
    completed: false,
    autoTriggeredBy: 'AI Trigger: Peak residential AC cooling demand',
    priority: 'Medium'
  }
];
