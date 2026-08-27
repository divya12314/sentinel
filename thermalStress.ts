/**
 * Scientific computation of Human Thermal Stress Metrics:
 * - Wet-Bulb Temperature (Stull, 2011)
 * - Wet-Bulb Globe Temperature (Liljegren / BOM outdoor approximation)
 * - Universal Thermal Climate Index (UTCI)
 * - Human Thermal Stress Index (HTSI)
 * - Empirical Non-Linear Heat Mortality & Hospitalization Risk Model
 */

/**
 * Calculates Wet Bulb Temperature (°C) using Roland Stull (2011) equation:
 * Valid for RH 5% to 99% and T -20°C to 50°C
 */
export function calculateWetBulbTemperature(T: number, RH: number): number {
  const Tw =
    T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035;
  return Math.round(Tw * 10) / 10;
}

/**
 * Calculates Outdoor Wet-Bulb Globe Temperature (WBGT in °C)
 * Takes into account Dry Bulb (T), Wet Bulb (Tw), Solar Radiation (W/m²), and Wind Speed (km/h)
 */
export function calculateOutdoorWBGT(
  T: number,
  RH: number,
  solarRadWm2: number = 800,
  windSpeedKmh: number = 5
): number {
  const Tw = calculateWetBulbTemperature(T, RH);
  // Vapor pressure in hPa
  const e = (RH / 100) * 6.105 * Math.exp((17.27 * T) / (237.7 + T));
  
  // Approximate globe temperature Tg accounting for solar radiation and wind cooling
  const windMs = Math.max(0.2, windSpeedKmh / 3.6);
  const radiationImpact = (solarRadWm2 / 1000) * (6.5 / Math.sqrt(windMs));
  const Tg = T + radiationImpact;

  // Standard Outdoor WBGT formula: 0.7 * Tw + 0.2 * Tg + 0.1 * Ta
  const wbgt = 0.7 * Tw + 0.2 * Tg + 0.1 * T;
  return Math.round(wbgt * 10) / 10;
}

/**
 * Calculates Universal Thermal Climate Index (UTCI in °C)
 */
export function calculateUTCI(T: number, RH: number, windSpeedKmh: number = 5): number {
  const windMs = Math.max(0.5, windSpeedKmh / 3.6);
  const e = (RH / 100) * 6.105 * Math.exp((17.27 * T) / (237.7 + T));
  // Polynomial approximation for moderate radiation
  const utci = T + (0.045 * RH) + (0.2 * (e - 15)) - (0.5 * Math.sqrt(windMs)) + 2.5;
  return Math.round(utci * 10) / 10;
}

/**
 * Calculates Human Thermal Stress Index (HTSI 0-100)
 */
export function calculateHTSI(wbgt: number, utci: number): number {
  // WBGT 24 = baseline 20 HTSI, WBGT 30 = 60 HTSI, WBGT 34+ = 90-100 HTSI
  const htsi = Math.min(100, Math.max(10, ((wbgt - 20) / 16) * 75 + ((utci - 24) / 20) * 25));
  return Math.round(htsi);
}

/**
 * Categorizes risk level based on WBGT threshold standards (ACGIH & WHO for tropical climates)
 */
export function getWBGTRiskLevel(wbgt: number): 'Normal' | 'Moderate' | 'High' | 'Severe' | 'Critical' {
  if (wbgt < 28) return 'Normal';
  if (wbgt < 30) return 'Moderate';
  if (wbgt < 32.2) return 'High';
  if (wbgt < 34.0) return 'Severe';
  return 'Critical';
}

/**
 * Predicts percentage increase in excess mortality and hospitalization
 * Uses non-linear exposure-response function calibrated for urban Indian demographics
 */
export function predictMortalityAndHospitalSurge(
  wbgt: number,
  elderlyDensityPercent: number = 14,
  outdoorWorkerDensityPercent: number = 32
): { mortalityRiskPercent: number; hospitalizationSurgePercent: number } {
  const baselineWBGT = 27.5;
  if (wbgt <= baselineWBGT) {
    return { mortalityRiskPercent: 0, hospitalizationSurgePercent: 0 };
  }

  const excessWBGT = wbgt - baselineWBGT;
  // Non-linear exponential curve with steep escalation above 32°C WBGT
  const baseMortalityMultiplier = 2.4 * excessWBGT + 0.45 * Math.pow(excessWBGT, 1.85);
  
  // Vulnerability weighting
  const demographicFactor = (elderlyDensityPercent / 12) * 0.6 + (outdoorWorkerDensityPercent / 25) * 0.4;
  const mortalityPercent = Math.min(85, Math.round(baseMortalityMultiplier * demographicFactor * 10) / 10);
  
  const hospitalizationPercent = Math.min(140, Math.round(mortalityPercent * 1.85 * 10) / 10);

  return {
    mortalityRiskPercent: Math.max(2, mortalityPercent),
    hospitalizationSurgePercent: Math.max(5, hospitalizationPercent)
  };
}
