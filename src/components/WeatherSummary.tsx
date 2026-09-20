import React from 'react';
import * as Icons from 'lucide-react';
import { DayCommuteForecast, UserPreferences } from '../types';
import { getWMOInfo, getWindRelation, getCardinalDirection } from '../utils';

interface WeatherSummaryProps {
  forecast: DayCommuteForecast;
  preferences: UserPreferences;
}

// Dynamic Lucide Icon Helper
function WeatherIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.Cloud className={className} />;
  return <IconComponent className={className} />;
}

export default function WeatherSummary({ forecast, preferences }: WeatherSummaryProps) {
  const { overallScore, verdict, reasons, morning, evening } = forecast;

  // Visual Styling Maps based on verdict
  const themeMap = {
    Excellent: {
      bg: 'bg-emerald-50 border-emerald-100',
      text: 'text-emerald-800',
      accent: 'text-emerald-500',
      border: 'border-emerald-200',
      progress: 'stroke-emerald-500',
      badge: 'bg-emerald-500 text-white',
      desc: 'Absolutely gorgeous riding conditions. Zero excuses—get out there on two wheels!',
      icon: 'Sparkles',
    },
    Good: {
      bg: 'bg-teal-50 border-teal-100',
      text: 'text-teal-800',
      accent: 'text-teal-500',
      border: 'border-teal-200',
      progress: 'stroke-teal-500',
      badge: 'bg-teal-500 text-white',
      desc: 'Very rideable with minor factors like a light breeze or slightly cool temps.',
      icon: 'CheckCircle2',
    },
    Challenging: {
      bg: 'bg-amber-50 border-amber-100',
      text: 'text-amber-800',
      accent: 'text-amber-500',
      border: 'border-amber-200',
      progress: 'stroke-amber-500',
      badge: 'bg-amber-500 text-white',
      desc: 'Conditions are suboptimal. Layer up, pack windproofs, or take precautions.',
      icon: 'AlertTriangle',
    },
    Hazardous: {
      bg: 'bg-rose-50 border-rose-100',
      text: 'text-rose-800',
      accent: 'text-rose-500',
      border: 'border-rose-200',
      progress: 'stroke-rose-500',
      badge: 'bg-rose-500 text-white',
      desc: 'Unsafe commute conditions. Heavy precipitation, high winds, or freeze. Better to take public transit/car today!',
      icon: 'AlertOctagon',
    },
  };

  const currentTheme = themeMap[verdict];

  // SVG Gauge calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  const formatHourString = (hour: number): string => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour > 12) return `${hour - 12}:00 PM`;
    return `${hour}:00 AM`;
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6">
        <div className="flex flex-col gap-6">
          {/* Gauge and Suitability Summary */}
            <div className={`flex flex-col md:flex-row gap-6 p-5 rounded-2xl border ${currentTheme.bg}`}>
              {/* Gauge */}
              <div className="flex items-center justify-center shrink-0">
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <svg className="h-full w-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      className="stroke-slate-200/60"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    {/* Score circle */}
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      className={`transition-all duration-1000 ease-out ${currentTheme.progress}`}
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  {/* Inside text */}
                  <div className="absolute text-center">
                    <span className="text-3xl font-extrabold text-slate-800 block leading-none font-mono">
                      {overallScore}
                    </span>
                    <span className="text-xxs font-semibold text-slate-400 uppercase tracking-wider mt-1 block">
                      Suitability
                    </span>
                  </div>
                </div>
              </div>

              {/* Verdict Text */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${currentTheme.badge}`}>
                    {verdict}
                  </span>
                  <WeatherIcon name={currentTheme.icon} className={`h-5 w-5 ${currentTheme.accent}`} />
                </div>
                <h3 className="text-slate-800 font-bold text-xl mt-2 leading-snug">
                  {verdict === 'Excellent' || verdict === 'Good' 
                    ? 'Perfect Commute Day!' 
                    : 'Commute Prep Required'}
                </h3>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                  {currentTheme.desc}
                </p>
              </div>
            </div>

            {/* Commute Window Breakdowns (AM vs. PM) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Morning Commute */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Icons.SunDim className="h-4 w-4 text-amber-500" />
                      AM COMMUTE ({formatHourString(preferences.morningCommuteHour)})
                    </span>
                  </div>

                  {morning ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                          <WeatherIcon name={getWMOInfo(morning.weatherCode).icon} className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-700 block">
                            {getWMOInfo(morning.weatherCode).description}
                          </span>
                          <span className="text-xs text-slate-400">
                            Precipitation: {morning.rainProbability}%
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-slate-800 block font-mono">
                          {Math.round(morning.temp)}°{preferences.tempUnit}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center justify-end gap-1 font-medium">
                          <Icons.Wind className="h-3 w-3" />
                          {Math.round(morning.windSpeed)} {preferences.windUnit}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm py-4 text-center font-medium">
                      Commute hour out of range or unavailable.
                    </div>
                  )}
                </div>

                {morning && (
                  <div className="flex flex-wrap items-center justify-between border-t border-slate-100/80 pt-2.5 text-xxs font-semibold gap-2">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Icons.Navigation className="h-3 w-3 text-slate-400" />
                      Riding Heading: <span className="text-slate-700">{getCardinalDirection(preferences.commuteHeading)} ({preferences.commuteHeading}°)</span>
                    </span>
                    {(() => {
                      const rel = getWindRelation(preferences.commuteHeading, morning.windDirection);
                      const windFrom = getCardinalDirection(morning.windDirection);
                      const arrowRotation = (morning.windDirection + 180) % 360;
                      
                      const badgeColors = {
                        Headwind: 'bg-rose-50 text-rose-700 border-rose-100',
                        Tailwind: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                        Crosswind: 'bg-slate-100 text-slate-600 border-slate-200'
                      }[rel.type];

                      return (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">From {windFrom}</span>
                          <div 
                            className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-full bg-white border border-slate-200 shrink-0 shadow-xxs"
                            style={{ transform: `rotate(${arrowRotation}deg)` }}
                            title={`Wind blowing towards ${getCardinalDirection(arrowRotation)}`}
                          >
                            <Icons.ArrowUp className="h-2.5 w-2.5 text-slate-500" />
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${badgeColors}`}>
                            {rel.type}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Evening Commute */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Icons.Sunset className="h-4 w-4 text-sky-500" />
                      PM COMMUTE ({formatHourString(preferences.eveningCommuteHour)})
                    </span>
                  </div>

                  {evening ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                          <WeatherIcon name={getWMOInfo(evening.weatherCode).icon} className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-700 block">
                            {getWMOInfo(evening.weatherCode).description}
                          </span>
                          <span className="text-xs text-slate-400">
                            Precipitation: {evening.rainProbability}%
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-slate-800 block font-mono">
                          {Math.round(evening.temp)}°{preferences.tempUnit}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center justify-end gap-1 font-medium">
                          <Icons.Wind className="h-3 w-3" />
                          {Math.round(evening.windSpeed)} {preferences.windUnit}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm py-4 text-center font-medium">
                      Commute hour out of range or unavailable.
                    </div>
                  )}
                </div>

                {evening && (
                  <div className="flex flex-wrap items-center justify-between border-t border-slate-100/80 pt-2.5 text-xxs font-semibold gap-2">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Icons.Navigation className="h-3 w-3 text-slate-400" />
                      Riding Heading: <span className="text-slate-700">{getCardinalDirection((preferences.commuteHeading + 180) % 360)} ({((preferences.commuteHeading + 180) % 360)}°)</span>
                    </span>
                    {(() => {
                      const eveningHeading = (preferences.commuteHeading + 180) % 360;
                      const rel = getWindRelation(eveningHeading, evening.windDirection);
                      const windFrom = getCardinalDirection(evening.windDirection);
                      const arrowRotation = (evening.windDirection + 180) % 360;
                      
                      const badgeColors = {
                        Headwind: 'bg-rose-50 text-rose-700 border-rose-100',
                        Tailwind: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                        Crosswind: 'bg-slate-100 text-slate-600 border-slate-200'
                      }[rel.type];

                      return (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">From {windFrom}</span>
                          <div 
                            className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-full bg-white border border-slate-200 shrink-0 shadow-xxs"
                            style={{ transform: `rotate(${arrowRotation}deg)` }}
                            title={`Wind blowing towards ${getCardinalDirection(arrowRotation)}`}
                          >
                            <Icons.ArrowUp className="h-2.5 w-2.5 text-slate-500" />
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${badgeColors}`}>
                            {rel.type}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Reasons / Factor Violations */}
            {reasons.length > 0 && (
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/20">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Icons.ShieldAlert className="h-4 w-4 text-amber-500" />
                  Suitability Factors & Limits
                </h4>
                <ul className="flex flex-col gap-2">
                  {reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
