import React from 'react';
import * as Icons from 'lucide-react';
import { DayCommuteForecast, UserPreferences } from '../types';
import { formatFriendlyDate, getWMOInfo } from '../utils';

interface SevenDayForecastProps {
  forecasts: DayCommuteForecast[];
  preferences: UserPreferences;
  selectedDayIndex: number;
  onSelectDayIndex: (index: number) => void;
}

function WeatherIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.Cloud className={className} />;
  return <IconComponent className={className} />;
}

export default function SevenDayForecast({
  forecasts,
  preferences,
  selectedDayIndex,
  onSelectDayIndex,
}: SevenDayForecastProps) {
  
  // Custom styling colors for badges
  const badgeColors = {
    Excellent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Good: 'bg-teal-50 text-teal-700 border-teal-100',
    Challenging: 'bg-amber-50 text-amber-700 border-amber-100',
    Hazardous: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  const scoreBarColors = {
    Excellent: 'bg-emerald-500',
    Good: 'bg-teal-500',
    Challenging: 'bg-amber-500',
    Hazardous: 'bg-rose-500',
  };

  const getDayLabel = (dateStr: string, index: number): string => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-200">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-3">
        <Icons.Calendar className="h-4.5 w-4.5 text-emerald-500" />
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">
          7-Day Commute outlook
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {forecasts.map((day, idx) => {
          const isSelected = idx === selectedDayIndex;
          const dayLabel = getDayLabel(day.date, idx);
          const friendlyDate = formatFriendlyDate(day.date);
          const activeBadgeClass = badgeColors[day.verdict];
          const barColorClass = scoreBarColors[day.verdict];

          return (
            <button
              key={day.date}
              onClick={() => onSelectDayIndex(idx)}
              className={`w-full text-left p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-all cursor-pointer ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/10 shadow-xs ring-1 ring-emerald-500/20'
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
              }`}
            >
              {/* Day Header */}
              <div className="flex-1 min-w-[130px]">
                <span className="font-bold text-slate-800 text-sm block leading-tight">
                  {dayLabel}
                </span>
                <span className="text-xxs text-slate-400 font-medium">
                  {friendlyDate}
                </span>
              </div>

              {/* Weather Windows Quick Summary Icons */}
              <div className="flex items-center gap-3.5 shrink-0">
                {/* Morning icon */}
                {day.morning ? (
                  <div className="flex items-center gap-1 bg-slate-50/80 px-2 py-1 rounded-lg border border-slate-100" title="AM weather">
                    <span className="text-xxs font-bold text-slate-400">AM</span>
                    <WeatherIcon name={getWMOInfo(day.morning.weatherCode).icon} className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                ) : (
                  <span className="text-xxs text-slate-300">-</span>
                )}

                {/* Evening icon */}
                {day.evening ? (
                  <div className="flex items-center gap-1 bg-slate-50/80 px-2 py-1 rounded-lg border border-slate-100" title="PM weather">
                    <span className="text-xxs font-bold text-slate-400">PM</span>
                    <WeatherIcon name={getWMOInfo(day.evening.weatherCode).icon} className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                ) : (
                  <span className="text-xxs text-slate-300">-</span>
                )}
              </div>

              {/* Progress score bar */}
              <div className="flex-1 min-w-[100px] md:max-w-[200px] flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColorClass}`}
                    style={{ width: `${day.overallScore}%` }}
                  />
                </div>
                <span className="text-xs font-black text-slate-700 font-mono w-7 text-right">
                  {day.overallScore}
                </span>
              </div>

              {/* Rating badge */}
              <div className="shrink-0 flex items-center gap-1">
                <span className={`px-2.5 py-1 rounded-lg text-xxs font-extrabold uppercase tracking-wide border ${activeBadgeClass}`}>
                  {day.verdict}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
