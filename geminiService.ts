import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export async function generatePublicHealthAdvisory(
  zoneName: string,
  wbgt: number,
  temp: number,
  humidity: number,
  mortalityIncrease: number,
  vulnerableGroups: string[]
): Promise<{ advisory: string; keyDirectives: string[]; smsDraft: string }> {
  const ai = getAI();

  // Dynamic advisory builder for offline / keyless fallback
  const createDynamicFallback = () => {
    const isCritical = wbgt >= 33.5;
    const isSevere = wbgt >= 31.5;

    const advisory = isCritical
      ? `CRITICAL PUBLIC HEALTH WARNING: ${zoneName} has reached a severe Wet-Bulb Globe Temperature of ${wbgt}°C (${temp}°C at ${humidity}% RH). High humidity drastically inhibits perspiration evaporation, escalating thermal core strain. Projected excess mortality risk: +${mortalityIncrease}%. Immediate municipal interventions active.`
      : isSevere
      ? `URGENT HEAT ADVISORY: ${zoneName} is recording elevated thermal stress at WBGT ${wbgt}°C (${temp}°C, ${humidity}% humidity). Elevated heat exhaustion risk noted for target groups: ${vulnerableGroups.slice(0, 2).join(', ')}. +${mortalityIncrease}% excess health impact projected.`
      : `ELEVATED THERMAL CAUTION: ${zoneName} WBGT is ${wbgt}°C (${temp}°C, ${humidity}% humidity). Outdoor workers and sensitive demographics should adhere to standard hydration cycles.`;

    const keyDirectives = [
      `Enforce mandatory rest and shaded hydration pauses (11:00 AM - 4:00 PM) for ${vulnerableGroups[1] || 'outdoor laborers'}`,
      `Deploy mobile ORS & potable hydration stations near high-density hubs in ${zoneName}`,
      `Place municipal hospital triage and emergency ICUs on Code Red heatstroke surge alert (+${mortalityIncrease}% projection)`,
      `Prioritize uninterrupted electricity feed to emergency healthcare and cooling centers`
    ];

    const smsDraft = `URGENT HEAT ADVISORY (${zoneName}): WBGT ${wbgt}°C. Avoid heavy outdoor exposure 11am-4pm. Water & cooling hubs active. Dial 108 for medical emergency.`;

    return { advisory, keyDirectives, smsDraft };
  };

  if (!ai) {
    return createDynamicFallback();
  }

  try {
    const prompt = `You are the Chief Epidemiologist and Disaster Management Officer for Sentinel Response Heat Warning System in India.
Current live meteorological and physiological telemetry for ${zoneName}:
- Ambient Dry-Bulb Temperature: ${temp}°C
- Relative Humidity: ${humidity}%
- Wet-Bulb Globe Temperature (WBGT): ${wbgt}°C (Critical Threshold: 32.0°C)
- Estimated Mortality Risk Surge: +${mortalityIncrease}%
- High Vulnerability Demographics: ${vulnerableGroups.join(', ')}

Provide an authoritative, actionable, concise emergency public health advisory.
Return your response ONLY in valid JSON format with keys:
- "advisory": A 2-3 sentence clinical epidemiological warning explaining the physiological risk of high humidity preventing evaporative cooling in this specific zone.
- "keyDirectives": An array of 4 strict municipal/hospital heat action mandates customized to this zone.
- "smsDraft": A crisp SMS/WhatsApp broadcast message under 150 characters including location, danger, curfew hours, and emergency action.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.advisory && Array.isArray(parsed.keyDirectives) && parsed.smsDraft) {
      return {
        advisory: parsed.advisory,
        keyDirectives: parsed.keyDirectives,
        smsDraft: parsed.smsDraft
      };
    }

    return createDynamicFallback();
  } catch (err) {
    console.error('Gemini advisory generation error, utilizing dynamic parametric builder:', (err as Error).message);
    return createDynamicFallback();
  }
}
