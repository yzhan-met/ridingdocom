export interface UserPreferences {
  minTemp: number;
  maxTemp: number;
  maxWind: number;
  maxRainProb: number;
  morningCommuteHour: number; // e.g., 8 for 08:00
  eveningCommuteHour: number; // e.g., 17 for 17:00
  tempUnit: 'F' | 'C';
  windUnit: 'mph' | 'kmh';
  commuteHeading: number; // angle in degrees to work (0 = North, 90 = East, 180 = South, 270 = West)
}

export interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

export interface WeatherCondition {
  temp: number;
  windSpeed: number;
  windDirection: number; // degrees (0-360)
  rainProbability: number;
  weatherCode: number;
  time: string;
}

export interface DayCommuteForecast {
  date: string;
  morning: WeatherCondition | null;
  evening: WeatherCondition | null;
  overallScore: number; // 0 to 100
  verdict: 'Excellent' | 'Good' | 'Challenging' | 'Hazardous';
  reasons: string[];
}

export interface WeatherForecast {
  currentTemp: number;
  currentWind: number;
  currentRainProb: number;
  currentCode: number;
  isDay: boolean;
  dailyForecasts: DayCommuteForecast[];
  hourlyRaw: WeatherCondition[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  minTemp: 7, // Celsius (~45°F)
  maxTemp: 30, // Celsius (~86°F)
  maxWind: 25, // km/h (~15 mph)
  maxRainProb: 20, // %
  morningCommuteHour: 8,
  eveningCommuteHour: 17,
  tempUnit: 'C',
  windUnit: 'kmh',
  commuteHeading: 90, // East
};

export const DEFAULT_LOCATION: LocationData = {
  name: 'Wellington',
  latitude: -41.2865,
  longitude: 174.7762,
  admin1: 'Wellington',
  country: 'New Zealand',
};
