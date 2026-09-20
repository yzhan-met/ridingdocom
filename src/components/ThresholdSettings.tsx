import React, { useState, useEffect } from 'react';
import { Settings, Thermometer, Wind, CloudRain, Clock, RefreshCw, Compass, X, Check, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPreferences, DEFAULT_PREFERENCES } from '../types';

interface ThresholdSettingsProps {
  preferences: UserPreferences;
  onPreferencesChange: (prefs: UserPreferences) => void;
}

export default function ThresholdSettings({ preferences, onPreferencesChange }: ThresholdSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const updatePref = (key: keyof UserPreferences, value: any) => {
    onPreferencesChange({
      ...preferences,
      [key]: value,
    });
  };

  const handleReset = () => {
    onPreferencesChange(DEFAULT_PREFERENCES);
  };

  const handleTempUnitToggle = () => {
    const isF = preferences.tempUnit === 'F';
    const nextUnit = isF ? 'C' : 'F';
    
    // Convert current ranges to preserve approximately the same comfort feels
    let nextMin = preferences.minTemp;
    let nextMax = preferences.maxTemp;
    
    if (isF) {
      // F -> C
      nextMin = Math.round(((preferences.minTemp - 32) * 5) / 9);
      nextMax = Math.round(((preferences.maxTemp - 32) * 5) / 9);
    } else {
      // C -> F
      nextMin = Math.round((preferences.minTemp * 9) / 5 + 32);
      nextMax = Math.round((preferences.maxTemp * 9) / 5 + 32);
    }

    onPreferencesChange({
      ...preferences,
      tempUnit: nextUnit,
      minTemp: nextMin,
      maxTemp: nextMax,
    });
  };

  const handleWindUnitToggle = () => {
    const isMph = preferences.windUnit === 'mph';
    const nextUnit = isMph ? 'kmh' : 'mph';
    
    let nextMaxWind = preferences.maxWind;
    if (isMph) {
      // mph -> kmh
      nextMaxWind = Math.round(preferences.maxWind * 1.60934);
    } else {
      // kmh -> mph
      nextMaxWind = Math.round(preferences.maxWind / 1.60934);
    }

    onPreferencesChange({
      ...preferences,
      windUnit: nextUnit,
      maxWind: nextMaxWind,
    });
  };

  // Human-friendly hourly display format
  const formatHourString = (hour: number): string => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour > 12) return `${hour - 12}:00 PM`;
    return `${hour}:00 AM`;
  };

  // Sliders scale based on active temperature unit
  const tempMinVal = preferences.tempUnit === 'F' ? 20 : -10;
  const tempMaxVal = preferences.tempUnit === 'F' ? 110 : 45;
  const windMaxVal = preferences.windUnit === 'mph' ? 40 : 65;

  return (
    <>
      {/* Floating Action Button at Bottom Right */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          id="open-comfort-settings-fab"
          onClick={() => setIsOpen(true)}
          className="group bg-slate-900 hover:bg-slate-800 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-xl shadow-slate-900/20 border border-slate-700/60 flex items-center gap-3 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Open Comfort Preferences"
          title="Adjust riding threshold limits, commute times & units"
        >
          <Settings className="h-5 w-5 text-emerald-400 group-hover:rotate-90 transition-transform duration-300 shrink-0" />
          <span className="hidden sm:inline font-bold text-xs tracking-wide">
            Comfort Preferences
          </span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
            °{preferences.tempUnit} · {preferences.windUnit}
          </span>
        </button>
      </div>

      {/* Pop-up Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-3xl max-w-lg w-full max-h-[85vh] shadow-2xl border border-slate-100 flex flex-col z-10 overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-base">Comfort Preferences</h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Configure your ideal cycling thresholds & schedule
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="close-settings-modal-btn"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  aria-label="Close settings"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {/* Toggle units at top */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Measurement Units
                  </span>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    <button
                      type="button"
                      onClick={handleTempUnitToggle}
                      className="px-3 py-2 text-xs font-bold rounded-xl bg-white shadow-xs border border-slate-100 text-slate-800 flex justify-between items-center hover:bg-slate-100/80 transition-colors cursor-pointer"
                    >
                      <span className="text-slate-500 font-medium">Temperature</span>
                      <span className="text-emerald-600 font-mono">°{preferences.tempUnit}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleWindUnitToggle}
                      className="px-3 py-2 text-xs font-bold rounded-xl bg-white shadow-xs border border-slate-100 text-slate-800 flex justify-between items-center hover:bg-slate-100/80 transition-colors cursor-pointer"
                    >
                      <span className="text-slate-500 font-medium">Wind Speed</span>
                      <span className="text-emerald-600 font-mono">{preferences.windUnit}</span>
                    </button>
                  </div>
                </div>

                {/* 1. Temp range */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Thermometer className="h-4 w-4 text-rose-500" />
                      Minimum Temperature Limit
                    </span>
                    <span className="text-slate-800 font-extrabold font-mono text-sm bg-slate-100 px-2 py-0.5 rounded-lg">
                      {preferences.minTemp}°{preferences.tempUnit}
                    </span>
                  </div>
                  <input
                    id="min-temp-slider"
                    type="range"
                    min={tempMinVal}
                    max={tempMaxVal - 15}
                    value={preferences.minTemp}
                    onChange={(e) => updatePref('minTemp', parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                  />
                  <span className="text-xxs text-slate-400">
                    Below this, cold weather penalty is applied to suitability score.
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      Maximum Temperature Limit
                    </span>
                    <span className="text-slate-800 font-extrabold font-mono text-sm bg-slate-100 px-2 py-0.5 rounded-lg">
                      {preferences.maxTemp}°{preferences.tempUnit}
                    </span>
                  </div>
                  <input
                    id="max-temp-slider"
                    type="range"
                    min={tempMinVal + 20}
                    max={tempMaxVal}
                    value={preferences.maxTemp}
                    onChange={(e) => updatePref('maxTemp', parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                  />
                  <span className="text-xxs text-slate-400">
                    Above this, heat caution penalties accumulate.
                  </span>
                </div>

                {/* 2. Max Wind Speed */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Wind className="h-4 w-4 text-sky-500" />
                      Maximum Wind Threshold
                    </span>
                    <span className="text-slate-800 font-extrabold font-mono text-sm bg-slate-100 px-2 py-0.5 rounded-lg">
                      {preferences.maxWind} {preferences.windUnit}
                    </span>
                  </div>
                  <input
                    id="max-wind-slider"
                    type="range"
                    min="2"
                    max={windMaxVal}
                    value={preferences.maxWind}
                    onChange={(e) => updatePref('maxWind', parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                  />
                  <span className="text-xxs text-slate-400">
                    Winds above this threshold are flagged as tough riding.
                  </span>
                </div>

                {/* 3. Max Rain Chance */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <CloudRain className="h-4 w-4 text-blue-500" />
                      Max Rain Probability
                    </span>
                    <span className="text-slate-800 font-extrabold font-mono text-sm bg-slate-100 px-2 py-0.5 rounded-lg">
                      {preferences.maxRainProb}%
                    </span>
                  </div>
                  <input
                    id="max-rain-slider"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={preferences.maxRainProb}
                    onChange={(e) => updatePref('maxRainProb', parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                  />
                  <span className="text-xxs text-slate-400">
                    Maximum acceptable chance of rain during commute.
                  </span>
                </div>

                {/* 4. Commute Direction (Heading) Compass */}
                <div className="border-t border-slate-100 pt-5 flex flex-col gap-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-emerald-500" />
                    Morning Commute Travel Direction
                  </span>
                  <span className="text-xxs text-slate-400 leading-normal">
                    Select your general compass heading to work. Return trip heading is calculated automatically to detect head/tailwinds!
                  </span>

                  <div className="flex justify-center my-1">
                    <div className="grid grid-cols-3 gap-2 w-full max-w-[260px]">
                      {/* Row 1 */}
                      <button
                        type="button"
                        id="heading-nw-btn"
                        onClick={() => updatePref('commuteHeading', 315)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                          preferences.commuteHeading === 315
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span>NW</span>
                        <span className="text-[9px] opacity-75 font-mono">315°</span>
                      </button>
                      <button
                        type="button"
                        id="heading-n-btn"
                        onClick={() => updatePref('commuteHeading', 0)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                          preferences.commuteHeading === 0
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span>N</span>
                        <span className="text-[9px] opacity-75 font-mono">0°</span>
                      </button>
                      <button
                        type="button"
                        id="heading-ne-btn"
                        onClick={() => updatePref('commuteHeading', 45)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                          preferences.commuteHeading === 45
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span>NE</span>
                        <span className="text-[9px] opacity-75 font-mono">45°</span>
                      </button>

                      {/* Row 2 */}
                      <button
                        type="button"
                        id="heading-w-btn"
                        onClick={() => updatePref('commuteHeading', 270)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                          preferences.commuteHeading === 270
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span>W</span>
                        <span className="text-[9px] opacity-75 font-mono">270°</span>
                      </button>
                      
                      <div className="bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-emerald-500">
                        <Compass className="h-5 w-5 animate-pulse" />
                      </div>

                      <button
                        type="button"
                        id="heading-e-btn"
                        onClick={() => updatePref('commuteHeading', 90)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                          preferences.commuteHeading === 90
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span>E</span>
                        <span className="text-[9px] opacity-75 font-mono">90°</span>
                      </button>

                      {/* Row 3 */}
                      <button
                        type="button"
                        id="heading-sw-btn"
                        onClick={() => updatePref('commuteHeading', 225)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                          preferences.commuteHeading === 225
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span>SW</span>
                        <span className="text-[9px] opacity-75 font-mono">225°</span>
                      </button>
                      <button
                        type="button"
                        id="heading-s-btn"
                        onClick={() => updatePref('commuteHeading', 180)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                          preferences.commuteHeading === 180
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span>S</span>
                        <span className="text-[9px] opacity-75 font-mono">180°</span>
                      </button>
                      <button
                        type="button"
                        id="heading-se-btn"
                        onClick={() => updatePref('commuteHeading', 135)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                          preferences.commuteHeading === 135
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span>SE</span>
                        <span className="text-[9px] opacity-75 font-mono">135°</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5. Commute Hour Selectors */}
                <div className="border-t border-slate-100 pt-5 flex flex-col gap-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-emerald-500" />
                    Commute Times
                  </span>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="am-commute-select" className="text-xs font-medium text-slate-500">
                        Morning (AM)
                      </label>
                      <select
                        id="am-commute-select"
                        value={preferences.morningCommuteHour}
                        onChange={(e) => updatePref('morningCommuteHour', parseInt(e.target.value, 10))}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                      >
                        {[5, 6, 7, 8, 9, 10, 11, 12].map((hr) => (
                          <option key={hr} value={hr}>
                            {formatHourString(hr)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="pm-commute-select" className="text-xs font-medium text-slate-500">
                        Evening (PM)
                      </label>
                      <select
                        id="pm-commute-select"
                        value={preferences.eveningCommuteHour}
                        onChange={(e) => updatePref('eveningCommuteHour', parseInt(e.target.value, 10))}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                      >
                        {[13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((hr) => (
                          <option key={hr} value={hr}>
                            {formatHourString(hr)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  id="reset-prefs-btn"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset Defaults
                </button>

                <button
                  type="button"
                  id="apply-settings-btn"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  Save & Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
