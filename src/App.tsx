import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bike, Sparkles, Loader2, AlertCircle, ShieldAlert, CloudSun, Compass, HelpCircle, Settings, X } from 'lucide-react';

import {
  LocationData,
  UserPreferences,
  DEFAULT_LOCATION,
  DEFAULT_PREFERENCES,
  WeatherCondition,
  DayCommuteForecast,
  WeatherForecast,
} from './types';
import { calculateDayForecast, getHourFromISO } from './utils';

import LocationSelector from './components/LocationSelector';
import ThresholdSettings from './components/ThresholdSettings';
import WeatherSummary from './components/WeatherSummary';
import HourlyCommuteTimeline from './components/HourlyCommuteTimeline';
import SevenDayForecast from './components/SevenDayForecast';

export default function App() {
  // 1. Persistent States via localStorage
  const [location, setLocation] = useState<LocationData>(() => {
    try {
      const saved = localStorage.getItem('ride_commute_location');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('ride_commute_preferences');
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  // 2. Active View Controllers
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showComfortCallout, setShowComfortCallout] = useState<boolean>(true);

  // Sync state to local storage on edits
  useEffect(() => {
    localStorage.setItem('ride_commute_location', JSON.stringify(location));
  }, [location]);

  useEffect(() => {
    localStorage.setItem('ride_commute_preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Fetch forecast whenever location or preference units alter
  useEffect(() => {
    let isMounted = true;
    
    const fetchWeather = async () => {
      setIsLoading(true);
      setError(null);
      
      const tempUnitParam = preferences.tempUnit === 'F' ? 'fahrenheit' : 'celsius';
      const windUnitParam = preferences.windUnit === 'mph' ? 'mph' : 'kmh';
      
      try {
        const queryUrl = `/api/weather?latitude=${location.latitude}&longitude=${location.longitude}&temperature_unit=${tempUnitParam}&wind_speed_unit=${windUnitParam}`;
        
        const response = await fetch(queryUrl);
        if (!response.ok) {
          throw new Error('Weather service response was not ok');
        }
        
        const data = await response.json();
        
        if (!isMounted) return;
        if (!data.hourly || !data.hourly.time) {
          throw new Error('Weather data structure is invalid or unavailable.');
        }

        // Format raw Open-Meteo hourly arrays into typed objects
        const rawTimes: string[] = data.hourly.time;
        const rawTemps: number[] = data.hourly.temperature_2m;
        const rawPops: number[] = data.hourly.precipitation_probability;
        const rawCodes: number[] = data.hourly.weather_code;
        const rawWinds: number[] = data.hourly.wind_speed_10m;
        const rawWindDirs: number[] = data.hourly.wind_direction_10m || [];

        const hourlyConditions: WeatherCondition[] = rawTimes.map((time, idx) => ({
          time,
          temp: rawTemps[idx],
          rainProbability: rawPops[idx],
          weatherCode: rawCodes[idx],
          windSpeed: rawWinds[idx],
          windDirection: rawWindDirs[idx] || 0,
        }));

        // Calculate 7-Day forecasts specifically around selected commute hours
        const dailyForecasts: DayCommuteForecast[] = [];
        const uniqueDates = Array.from(new Set(rawTimes.map((t) => t.split('T')[0])));

        uniqueDates.slice(0, 7).forEach((dateStr, dayIdx) => {
          // Find the morning and evening commute conditions for this date
          const dayStartIdx = dayIdx * 24;
          
          const amHour = preferences.morningCommuteHour;
          const pmHour = preferences.eveningCommuteHour;
          
          const amCond = hourlyConditions[dayStartIdx + amHour] || null;
          const pmCond = hourlyConditions[dayStartIdx + pmHour] || null;

          const dayForecast = calculateDayForecast(dateStr, amCond, pmCond, preferences);
          dailyForecasts.push(dayForecast);
        });

        // Current weather approximation (use index 0 or nearest active hour)
        const currentHourIndex = new Date().getHours();
        const fallbackCurrent = hourlyConditions[currentHourIndex] || hourlyConditions[0];

        setWeatherForecast({
          currentTemp: fallbackCurrent.temp,
          currentWind: fallbackCurrent.windSpeed,
          currentRainProb: fallbackCurrent.rainProbability,
          currentCode: fallbackCurrent.weatherCode,
          isDay: currentHourIndex >= 6 && currentHourIndex <= 19,
          dailyForecasts,
          hourlyRaw: hourlyConditions,
        });
      } catch (err: any) {
        console.error('Fetch weather failed:', err);
        if (isMounted) {
          setError('Failed to load weather forecast for this location. Please check your internet connection and try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, [location, preferences.tempUnit, preferences.windUnit, preferences.morningCommuteHour, preferences.eveningCommuteHour, preferences.commuteHeading]);

  // Recalculate suitabilities dynamically on the fly if thresholds change (without re-fetching)
  useEffect(() => {
    if (!weatherForecast) return;

    const updatedForecasts = weatherForecast.dailyForecasts.map((day, idx) => {
      const dayStartIdx = idx * 24;
      const amHour = preferences.morningCommuteHour;
      const pmHour = preferences.eveningCommuteHour;
      const amCond = weatherForecast.hourlyRaw[dayStartIdx + amHour] || null;
      const pmCond = weatherForecast.hourlyRaw[dayStartIdx + pmHour] || null;

      return calculateDayForecast(day.date, amCond, pmCond, preferences);
    });

    setWeatherForecast((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        dailyForecasts: updatedForecasts,
      };
    });
  }, [preferences.minTemp, preferences.maxTemp, preferences.maxWind, preferences.maxRainProb, preferences.commuteHeading]);

  // Extract selected day's detailed hourly array for the horizontal strip
  const selectedDayHours = weatherForecast
    ? weatherForecast.hourlyRaw.slice(selectedDayIndex * 24, (selectedDayIndex + 1) * 24)
    : [];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-700 antialiased flex flex-col justify-between font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Page Header */}
      <header className="w-full bg-white border-b border-slate-100 py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-md shadow-emerald-500/10 flex items-center justify-center">
              <Bike className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                Commute Suitability Index
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Personalized cycling-to-work planner based on your exact comfort limits
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xxs font-bold text-slate-500 uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Weather Mode
          </div>
        </div>
      </header>

      {/* 2. Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Location & Quick Info) */}
          <section className="lg:col-span-4 flex flex-col gap-6 w-full">
            {/* Search/Geolocation Widget */}
            <LocationSelector
              currentLocation={location}
              onLocationSelect={(loc) => {
                setLocation(loc);
                setSelectedDayIndex(0); // Reset to today on city change
              }}
            />

            {/* Quick Comfort Settings Callout Card */}
            {showComfortCallout && (
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700/50 shadow-sm flex items-start gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                  <Settings className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1 pr-6">
                  <span className="text-xs font-bold text-slate-200">
                    Custom Riding Comfort Limits
                  </span>
                  <p className="text-xxs text-slate-400 leading-relaxed">
                    Tailor min/max temperature, wind caps, rain risk, and commute hours anytime using the floating button in the bottom-right corner ↘
                  </p>
                </div>
                <button
                  type="button"
                  id="dismiss-comfort-callout-btn"
                  onClick={() => setShowComfortCallout(false)}
                  className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  aria-label="Dismiss message"
                  title="Close tip"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>

          {/* Right Column (Live Weather Dashboards) */}
          <section className="lg:col-span-8 flex flex-col gap-6 w-full">
            <AnimatePresence mode="wait">
              {isLoading ? (
                /* Loading State Widget */
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-4 min-h-[450px]"
                >
                  <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                  <div>
                    <span className="text-sm font-bold text-slate-700 block">
                      Retrieving Atmospheric Forecasts...
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Contacting Open-Meteo for hourly coordinate diagnostics for {location.name}
                    </span>
                  </div>
                </motion.div>
              ) : error ? (
                /* Error State Widget */
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl p-12 border border-rose-100 shadow-sm flex flex-col items-center justify-center text-center gap-4 min-h-[450px]"
                >
                  <div className="p-3 bg-rose-50 text-rose-500 rounded-full">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Forecast Fetch Interrupted</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-md">
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={() => setLocation({ ...location })} // forces trigger effect
                    className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-colors"
                  >
                    Retry Fetching
                  </button>
                </motion.div>
              ) : weatherForecast ? (
                /* Success States */
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="flex flex-col gap-6"
                >
                  {/* Commute Suitability Summary & Gear Recommender */}
                  <WeatherSummary
                    forecast={weatherForecast.dailyForecasts[selectedDayIndex]}
                    preferences={preferences}
                  />

                  {/* Hourly Commute Timeline */}
                  <HourlyCommuteTimeline
                    hourlyData={selectedDayHours}
                    preferences={preferences}
                  />

                  {/* 7-Day Forecast Checklist List */}
                  <SevenDayForecast
                    forecasts={weatherForecast.dailyForecasts}
                    preferences={preferences}
                    selectedDayIndex={selectedDayIndex}
                    onSelectDayIndex={(idx) => setSelectedDayIndex(idx)}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Floating Preferences FAB & Modal */}
      <ThresholdSettings
        preferences={preferences}
        onPreferencesChange={(prefs) => setPreferences(prefs)}
      />

      {/* 3. Footer */}
      <footer className="w-full bg-white border-t border-slate-100 py-6 px-4 md:px-8 mt-12 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <span>
            © 2026 Commute Suitability Index. Created with raw, keyless atmospheric datasets from{' '}
            <a
              href="https://open-meteo.com"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-500 hover:underline font-semibold"
            >
              Open-Meteo Weather APIs
            </a>
            .
          </span>
          <span className="flex items-center gap-1">
            Always remember to wear a helmet and use safety lights!
          </span>
        </div>
      </footer>
    </div>
  );
}
