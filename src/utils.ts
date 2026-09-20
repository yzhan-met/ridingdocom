import { UserPreferences, WeatherCondition, DayCommuteForecast } from './types';

// Helper conversions
export const fToC = (f: number): number => ((f - 32) * 5) / 9;
export const cToF = (c: number): number => (c * 9) / 5 + 32;
export const mphToKmh = (mph: number): number => mph * 1.60934;
export const kmhToMph = (kmh: number): number => kmh / 1.60934;

/**
 * Maps WMO Weather Codes to descriptive strings, categories, and colors.
 */
export function getWMOInfo(code: number): {
  description: string;
  category: 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunderstorm';
  icon: string;
} {
  if (code === 0) {
    return { description: 'Clear Sky', category: 'clear', icon: 'Sun' };
  } else if (code >= 1 && code <= 3) {
    const desc = code === 1 ? 'Mainly Clear' : code === 2 ? 'Partly Cloudy' : 'Overcast';
    return { description: desc, category: 'cloudy', icon: 'Cloud' };
  } else if (code === 45 || code === 48) {
    return { description: 'Foggy', category: 'fog', icon: 'CloudFog' };
  } else if (code >= 51 && code <= 55) {
    return { description: 'Drizzle', category: 'rain', icon: 'CloudDrizzle' };
  } else if (code === 56 || code === 57) {
    return { description: 'Freezing Drizzle', category: 'rain', icon: 'CloudSnow' };
  } else if (code >= 61 && code <= 65) {
    const desc = code === 61 ? 'Light Rain' : code === 63 ? 'Moderate Rain' : 'Heavy Rain';
    return { description: desc, category: 'rain', icon: 'CloudRain' };
  } else if (code === 66 || code === 67) {
    return { description: 'Freezing Rain', category: 'rain', icon: 'CloudSnow' };
  } else if (code >= 71 && code <= 75) {
    return { description: 'Snowfall', category: 'snow', icon: 'Snowflake' };
  } else if (code === 77) {
    return { description: 'Snow Grains', category: 'snow', icon: 'Snowflake' };
  } else if (code >= 80 && code <= 82) {
    return { description: 'Rain Showers', category: 'rain', icon: 'CloudRainWind' };
  } else if (code === 85 || code === 86) {
    return { description: 'Snow Showers', category: 'snow', icon: 'Snowflake' };
  } else if (code >= 95 && code <= 99) {
    return { description: 'Thunderstorm', category: 'thunderstorm', icon: 'CloudLightning' };
  }
  return { description: 'Unknown Weather', category: 'clear', icon: 'Cloud' };
}

export interface WindRelation {
  type: 'Headwind' | 'Tailwind' | 'Crosswind';
  angleDifference: number;
}

/**
 * Calculates relative wind relationship based on travel heading and wind source direction.
 */
export function getWindRelation(travelHeading: number, windDir: number): WindRelation {
  let diff = Math.abs(travelHeading - windDir) % 360;
  if (diff > 180) {
    diff = 360 - diff;
  }
  
  if (diff < 45) {
    return { type: 'Headwind', angleDifference: diff };
  } else if (diff > 135) {
    return { type: 'Tailwind', angleDifference: diff };
  } else {
    return { type: 'Crosswind', angleDifference: diff };
  }
}

/**
 * Converts degree bearing (0-360) into a cardinal direction abbreviation.
 */
export function getCardinalDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round((degrees % 360) / 45) % 8;
  return directions[idx];
}

/**
 * Calculates a ride suitability score (0 - 100) for a specific single weather condition.
 */
export function calculateConditionScore(
  cond: WeatherCondition,
  prefs: UserPreferences,
  travelHeading: number
): { score: number; reasons: string[] } {
  let score = 100;
  const reasons: string[] = [];

  // 1. Temperature Calculation
  // Standardize preferences and conditions to Fahrenheit for calculation
  const tempF = prefs.tempUnit === 'F' ? cond.temp : cToF(cond.temp);
  const minF = prefs.tempUnit === 'F' ? prefs.minTemp : cToF(prefs.minTemp);
  const maxF = prefs.tempUnit === 'F' ? prefs.maxTemp : cToF(prefs.maxTemp);

  if (tempF < minF) {
    const diff = minF - tempF;
    const penalty = Math.min(40, diff * 3.5); // 3.5 points penalty per degree below min
    score -= penalty;
    if (penalty > 10) {
      reasons.push(`Chilly temperatures (${Math.round(cond.temp)}°${prefs.tempUnit}) are below your comfort threshold.`);
    }
  } else if (tempF > maxF) {
    const diff = tempF - maxF;
    const penalty = Math.min(35, diff * 3); // 3 points penalty per degree above max
    score -= penalty;
    if (penalty > 10) {
      reasons.push(`Hot weather (${Math.round(cond.temp)}°${prefs.tempUnit}) is warmer than your comfort limit.`);
    }
  }

  // 2. Wind Speed & Direction Calculation
  // Standardize wind to mph for evaluation
  const windMph = prefs.windUnit === 'mph' ? cond.windSpeed : kmhToMph(cond.windSpeed);
  const maxWindMph = prefs.windUnit === 'mph' ? prefs.maxWind : kmhToMph(prefs.maxWind);

  const windRel = getWindRelation(travelHeading, cond.windDirection);
  const windSourceCard = getCardinalDirection(cond.windDirection);
  const travelCard = getCardinalDirection(travelHeading);

  let windPenalty = 0;
  if (windMph > maxWindMph) {
    const diff = windMph - maxWindMph;
    windPenalty = Math.min(50, diff * 4.5); // Heavy wind penalty
    score -= windPenalty;
    reasons.push(`Gusty winds of ${Math.round(cond.windSpeed)} ${prefs.windUnit} exceed your threshold.`);
  } else if (windMph > maxWindMph * 0.7) {
    windPenalty = 10;
    score -= windPenalty; // Light warning penalty for moderate winds
  }

  // Wind direction modifier (only significant if wind is blowing at least 5 mph / 8 kmh)
  if (windMph >= 5) {
    if (windRel.type === 'Headwind') {
      const extraPenalty = Math.min(15, windMph * 0.6); // Headwind penalty
      score -= extraPenalty;
      reasons.push(`Stiff headwind from the ${windSourceCard} will slow you down on your ${travelCard} travel.`);
    } else if (windRel.type === 'Tailwind') {
      const bonus = Math.min(8, windMph * 0.35); // Tailwind boost!
      score += bonus;
      reasons.push(`Helpful tailwind from the ${windSourceCard} will push you along your ${travelCard} ride.`);
    } else {
      // Crosswinds
      if (windMph > 12) {
        score -= 5;
        reasons.push(`Grip bars firmly: Moderate crosswind (${windSourceCard}) blowing across your ${travelCard} route.`);
      }
    }
  }

  // 3. Precipitation Probability
  if (cond.rainProbability > prefs.maxRainProb) {
    const diff = cond.rainProbability - prefs.maxRainProb;
    const penalty = Math.min(45, diff * 1.2); // Up to 45 pts penalty
    score -= penalty;
    reasons.push(`High probability of rain (${cond.rainProbability}%) exceeds your threshold.`);
  } else if (cond.rainProbability > 10) {
    score -= 5; // Small penalty for dynamic dampness risk
  }

  // 4. Heavy Active Weather Checks (WMO codes)
  const weatherInfo = getWMOInfo(cond.weatherCode);
  if (weatherInfo.category === 'thunderstorm') {
    score -= 75; // Thunderstorms are highly hazardous
    reasons.push('Hazardous thunderstorm alert in the area!');
  } else if (weatherInfo.category === 'snow') {
    score -= 60; // Snow is extremely challenging and slippery
    reasons.push('Snow or freezing precipitation forecast.');
  } else if (weatherInfo.category === 'rain' && cond.weatherCode >= 63) {
    score -= 40; // Moderate to heavy rain
    reasons.push('Heavy rain forecast during your commute.');
  } else if (weatherInfo.category === 'fog') {
    score -= 15; // Low visibility
    reasons.push('Low visibility due to fog. Use bright lights.');
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
  };
}

/**
 * Computes the overall commute day forecast by reviewing both morning & evening windows.
 */
export function calculateDayForecast(
  dateStr: string,
  morning: WeatherCondition | null,
  evening: WeatherCondition | null,
  prefs: UserPreferences
): DayCommuteForecast {
  let morningScore = 100;
  let eveningScore = 100;
  let morningReasons: string[] = [];
  let eveningReasons: string[] = [];

  if (morning) {
    const res = calculateConditionScore(morning, prefs, prefs.commuteHeading);
    morningScore = res.score;
    morningReasons = res.reasons.map((r) => `[AM] ${r}`);
  }
  if (evening) {
    const res = calculateConditionScore(evening, prefs, (prefs.commuteHeading + 180) % 360);
    eveningScore = res.score;
    eveningReasons = res.reasons.map((r) => `[PM] ${r}`);
  }

  // The commute requires riding both ways, or at least managing your bike.
  // Therefore, the lower score heavily bottlenecks the overall suitability,
  // while the better score offers a slight positive offset.
  const lowerScore = Math.min(morningScore, eveningScore);
  const higherScore = Math.max(morningScore, eveningScore);
  const overallScore = Math.round(lowerScore * 0.75 + higherScore * 0.25);

  const combinedReasons = [...morningReasons, ...eveningReasons];
  // Deduplicate reasons slightly to make it clean
  const uniqueReasons = Array.from(new Set(combinedReasons));

  let verdict: DayCommuteForecast['verdict'] = 'Excellent';
  if (overallScore >= 80) {
    verdict = 'Excellent';
  } else if (overallScore >= 60) {
    verdict = 'Good';
  } else if (overallScore >= 35) {
    verdict = 'Challenging';
  } else {
    verdict = 'Hazardous';
  }

  return {
    date: dateStr,
    morning,
    evening,
    overallScore,
    verdict,
    reasons: uniqueReasons,
  };
}

/**
 * Suggests commuter clothing & prep checklist based on weather conditions.
 */
export interface GearItem {
  id: string;
  item: string;
  reason: string;
  type: 'clothing' | 'bike' | 'safety';
}

export function getSmartGearChecklist(
  morning: WeatherCondition | null,
  evening: WeatherCondition | null,
  prefs: UserPreferences
): GearItem[] {
  const list: GearItem[] = [];
  if (!morning && !evening) return list;

  const tempF_morning = morning ? (prefs.tempUnit === 'F' ? morning.temp : cToF(morning.temp)) : 70;
  const tempF_evening = evening ? (prefs.tempUnit === 'F' ? evening.temp : cToF(evening.temp)) : 70;
  const minTempF = Math.min(tempF_morning, tempF_evening);
  const maxTempF = Math.max(tempF_morning, tempF_evening);

  const maxWind_morning = morning ? (prefs.windUnit === 'mph' ? morning.windSpeed : kmhToMph(morning.windSpeed)) : 0;
  const maxWind_evening = evening ? (prefs.windUnit === 'mph' ? evening.windSpeed : kmhToMph(evening.windSpeed)) : 0;
  const maxWindMph = Math.max(maxWind_morning, maxWind_evening);

  const maxRainProb = Math.max(morning?.rainProbability || 0, evening?.rainProbability || 0);
  const morningCode = morning?.weatherCode || 0;
  const eveningCode = evening?.weatherCode || 0;
  const isWetCode = (code: number) => code >= 50 && code < 99;
  const isRainActive = isWetCode(morningCode) || isWetCode(eveningCode);

  // Temperature based clothing
  if (minTempF < 45) {
    list.push({
      id: 'heavy_gloves',
      item: 'Thermal Gloves & Beanie',
      reason: 'Extreme cold requires windproof gloves and under-helmet dome cover to avoid frozen fingers.',
      type: 'clothing',
    });
    list.push({
      id: 'thermal_layers',
      item: 'Heavy Thermal Layers & Neck Gaiter',
      reason: 'Keep your core and neck protected from freezing wind chill.',
      type: 'clothing',
    });
  } else if (minTempF < 55) {
    list.push({
      id: 'light_gloves',
      item: 'Full-Finger Gloves',
      reason: 'Chilly morning temps can stiffen your fingers, hindering braking performance.',
      type: 'clothing',
    });
    list.push({
      id: 'long_sleeves',
      item: 'Long-Sleeve Jersey or Wind Jacket',
      reason: 'Perfect midweight protection for temperatures below 55°F.',
      type: 'clothing',
    });
  } else if (minTempF < 65) {
    list.push({
      id: 'arm_warmers',
      item: 'Arm Warmers or Light Gilet',
      reason: 'Perfect for layering up in the morning and easily packing away for a warmer evening ride.',
      type: 'clothing',
    });
  }

  if (maxTempF > 85) {
    list.push({
      id: 'hydration',
      item: 'Extra Hydration Bottle (Electrolytes)',
      reason: 'Temps exceeding 85°F cause elevated sweat rates. Hydrate proactively.',
      type: 'safety',
    });
    list.push({
      id: 'sunscreen',
      item: 'UV Sunscreen & Cycling Sunglasses',
      reason: 'Protect your skin and eyes from solar radiation on hot, sunny stretches.',
      type: 'safety',
    });
    list.push({
      id: 'breathable',
      item: 'Super Lightweight/Vented Jersey',
      reason: 'Highly breathable kit to maximize cooling evaporative airflow.',
      type: 'clothing',
    });
  }

  // Wind-based suggestions
  if (maxWindMph > 14) {
    list.push({
      id: 'gilet',
      item: 'Fitted Windproof Vest/Windbreaker',
      reason: 'Shields chest from wind draft while preventing sweat build-up.',
      type: 'clothing',
    });
  }

  // Precipitation suggestions
  if (isRainActive || maxRainProb > 30) {
    list.push({
      id: 'rain_jacket',
      item: 'Waterproof Hardshell Jacket',
      reason: 'Essential waterproof layer to keep your core dry and warm in active rain.',
      type: 'clothing',
    });
    list.push({
      id: 'fenders',
      item: 'Mudguards/Fenders',
      reason: 'Prevents tire spray from soaking your back, drivetrain, and shoes.',
      type: 'bike',
    });
    if (isRainActive) {
      list.push({
        id: 'chain_lube',
        item: 'Wet Chain Lubricant',
        reason: 'Wet road spray washes off dry lube. Use heavy wet-lube to protect your chain.',
        type: 'bike',
      });
    }
  }

  // General safety baseline
  list.push({
    id: 'helmet',
    item: 'Certified Helmet',
    reason: 'Non-negotiable head protection for every single commute.',
    type: 'safety',
  });

  list.push({
    id: 'lights',
    item: 'Charged Front & Rear Safety Lights',
    reason: 'Vital for high visibility in busy commuter traffic, especially at twilight or during fog.',
    type: 'safety',
  });

  return list;
}

/**
 * Parses full ISO timestamp string to retrieve hours for filtering.
 * E.g., "2026-07-17T08:00" -> 8
 */
export function getHourFromISO(isoString: string): number {
  try {
    const parts = isoString.split('T');
    if (parts.length < 2) return 0;
    const hourPart = parts[1].split(':')[0];
    return parseInt(hourPart, 10);
  } catch {
    return 0;
  }
}

/**
 * Formats a short date string
 * E.g., "2026-07-17" -> "Friday, Jul 17"
 */
export function formatFriendlyDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Returns weather icon component lookup name based on WMO code.
 */
export function getWeatherIconName(code: number): string {
  return getWMOInfo(code).icon;
}
