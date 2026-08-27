import { CitizenProfile, WardMetric } from '../types';

export function calculateDailyWaterRequirement(
  profile: CitizenProfile,
  zoneMetric: WardMetric
): {
  totalTargetMl: number;
  baseRequirementMl: number;
  heatStressBonusMl: number;
  laborBonusMl: number;
  recommendedIntakeIntervalMinutes: number;
  electrolytesNeeded: boolean;
} {
  // Baseline: 35ml per kg of body weight
  const baseRequirementMl = Math.round(profile.weightKg * 35);

  // Heat stress addition based on WBGT
  let heatStressBonusMl = 0;
  if (zoneMetric.wbgt >= 34.0) {
    heatStressBonusMl = 1200;
  } else if (zoneMetric.wbgt >= 32.0) {
    heatStressBonusMl = 800;
  } else if (zoneMetric.wbgt >= 29.0) {
    heatStressBonusMl = 400;
  }

  // Work exposure and labor intensity addition
  let laborBonusMl = 0;
  if (profile.outdoorExposure === 'high_exposure') {
    laborBonusMl += 1000;
  } else if (profile.outdoorExposure === 'moderate_exposure') {
    laborBonusMl += 500;
  }

  if (profile.activityIntensity === 'heavy_labor') {
    laborBonusMl += 800;
  } else if (profile.activityIntensity === 'moderate') {
    laborBonusMl += 400;
  }

  // Senior / Child adjustments
  let totalTargetMl = baseRequirementMl + heatStressBonusMl + laborBonusMl;
  if (profile.ageBracket === 'senior') {
    // Slower thirst sensation, steady sips recommended
    totalTargetMl = Math.min(totalTargetMl, 4200); // Cap to avoid hyponatremia without electrolytes
  }

  const recommendedIntakeIntervalMinutes = zoneMetric.wbgt >= 33 ? 20 : 30;
  const electrolytesNeeded = zoneMetric.wbgt >= 31 || profile.outdoorExposure === 'high_exposure';

  return {
    totalTargetMl,
    baseRequirementMl,
    heatStressBonusMl,
    laborBonusMl,
    recommendedIntakeIntervalMinutes,
    electrolytesNeeded
  };
}

export function generatePersonalizedHealthAdvisory(
  profile: CitizenProfile,
  zoneMetric: WardMetric
): {
  healthRiskLevel: 'Low' | 'Moderate' | 'High' | 'Severe' | 'Critical';
  vulnerabilitySummary: string;
  workRestProtocol: string;
  immediatePrecautions: string[];
  warningSymptoms: string[];
} {
  const isHighExposure = profile.outdoorExposure === 'high_exposure';
  const isSenior = profile.age >= 65 || profile.ageBracket === 'senior';
  const isChild = profile.age < 18 || profile.ageBracket === 'child';
  const hasCardiacOrBP = profile.preExistingConditions.some(c =>
    c.toLowerCase().includes('hypertension') ||
    c.toLowerCase().includes('cardiac') ||
    c.toLowerCase().includes('heart')
  );

  let healthRiskLevel: 'Low' | 'Moderate' | 'High' | 'Severe' | 'Critical' = 'Moderate';
  if (zoneMetric.wbgt >= 34.0) {
    healthRiskLevel = 'Critical';
  } else if (zoneMetric.wbgt >= 32.0 || (isHighExposure && zoneMetric.wbgt >= 30.0)) {
    healthRiskLevel = 'Severe';
  } else if (zoneMetric.wbgt >= 29.0) {
    healthRiskLevel = 'High';
  }

  if ((isSenior || hasCardiacOrBP) && healthRiskLevel !== 'Critical') {
    healthRiskLevel = healthRiskLevel === 'High' ? 'Severe' : 'High';
  }

  // Work Rest cycle
  let workRestProtocol = 'Normal work schedule. Hydrate at 45 min intervals.';
  if (zoneMetric.wbgt >= 34.0 || healthRiskLevel === 'Critical') {
    workRestProtocol = 'HALT outdoor heavy labor between 11:00 AM - 4:00 PM. Maximum 15 min light work / 45 min shade rest per hour.';
  } else if (zoneMetric.wbgt >= 32.0) {
    workRestProtocol = '30 min work / 30 min rest cycle under shade. Mandatory hydration every 20 minutes.';
  } else if (zoneMetric.wbgt >= 30.0) {
    workRestProtocol = '45 min work / 15 min rest cycle under shaded canopy.';
  }

  const immediatePrecautions: string[] = [
    `Consume ${Math.round(profile.dailyWaterTargetMl / 1000 * 10) / 10}L water with Oral Rehydration Salts (ORS) or electrolyte lemon water today.`,
    'Wear loose, light-colored, breathable cotton clothing and wide-brim hat.',
    'Avoid direct sun exposure between 11:00 AM and 04:00 PM when solar radiation peaks.',
    'Drape a damp, cool cloth or towel around neck and wrists during work breaks.'
  ];

  if (isSenior || hasCardiacOrBP) {
    immediatePrecautions.push('Stay in air-cooled or shaded indoor areas; heat puts acute strain on cardiovascular function.');
  }
  if (isHighExposure) {
    immediatePrecautions.push('Locate nearest municipal cooling hub or shaded water station on the map below.');
  }

  const warningSymptoms = [
    'Dizziness, lightheadedness or sudden confusion',
    'Severe muscle cramps or absence of sweating despite extreme heat',
    'Rapid pulse, throbbing headache, or nausea/vomiting',
    'Fainting or body temperature exceeding 39°C (Call 108 Emergency immediately)'
  ];

  const vulnerabilitySummary = `${profile.ageBracket.toUpperCase()} • ${
    isHighExposure ? 'High Outdoor Exposure (6+ hrs)' : 'Standard Exposure'
  } • ${profile.weightKg} kg ${profile.preExistingConditions.length > 0 ? `• Conditions: ${profile.preExistingConditions.join(', ')}` : ''}`;

  return {
    healthRiskLevel,
    vulnerabilitySummary,
    workRestProtocol,
    immediatePrecautions,
    warningSymptoms
  };
}
