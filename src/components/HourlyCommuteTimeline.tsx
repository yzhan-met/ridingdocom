import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { WeatherCondition, UserPreferences } from '../types';
import { getWMOInfo, getCardinalDirection } from '../utils';

interface HourlyCommuteTimelineProps {
  hourlyData: WeatherCondition[];
  preferences: UserPreferences;
}

function WeatherIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.Cloud className={className} />;
  return <IconComponent className={className} />;
}

export default function HourlyCommuteTimeline({ hourlyData, preferences }: HourlyCommuteTimelineProps) {
  const [expandedHours, setExpandedHours] = useState<string[]>([]);

  const formatHourString = (isoString: string): string => {
    try {
      const parts = isoString.split('T');
      if (parts.length < 2) return isoString;
      const hourPart = parseInt(parts[1].split(':')[0], 10);
      
      if (hourPart === 0) return '12 AM';
      if (hourPart === 12) return '12 PM';
      if (hourPart > 12) return `${hourPart - 12} PM`;
      return `${hourPart} AM`;
    } catch {
      return isoString;
    }
  };

  const getHourNumber = (isoString: string): number => {
    try {
      const parts = isoString.split('T');
      if (parts.length < 2) return 0;
      return parseInt(parts[1].split(':')[0], 10);
    } catch {
      return 0;
    }
  };

  // Filter hourly weather to daytime commute range (e.g., 5 AM to 9 PM) to focus purely on active commuter hours.
  const daytimeHours = hourlyData.filter((item) => {
    const hr = getHourNumber(item.time);
    return hr >= 5 && hr <= 22;
  });

  const toggleHour = (time: string) => {
    setExpandedHours((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const expandAll = () => {
    const nonCommuteTimes = daytimeHours
      .filter((item) => {
        const hr = getHourNumber(item.time);
        return hr !== preferences.morningCommuteHour && hr !== preferences.eveningCommuteHour;
      })
      .map((item) => item.time);
    setExpandedHours(nonCommuteTimes);
  };

  const collapseAll = () => {
    setExpandedHours([]);
  };

  const hasNonCommuteHours = daytimeHours.some((item) => {
    const hr = getHourNumber(item.time);
    return hr !== preferences.morningCommuteHour && hr !== preferences.eveningCommuteHour;
  });

  const allExpanded = hasNonCommuteHours && daytimeHours
    .filter((item) => {
      const hr = getHourNumber(item.time);
      return hr !== preferences.morningCommuteHour && hr !== preferences.eveningCommuteHour;
    })
    .every((item) => expandedHours.includes(item.time));

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-200 flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 items-center justify-between border-b border-slate-50 pb-3">
        <div className="flex items-center gap-2">
          <Icons.Clock className="h-4.5 w-4.5 text-emerald-500" />
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">
            Hourly Commute Timeline
          </h3>
        </div>
        
        <div className="flex items-center gap-3">
          {hasNonCommuteHours && (
            <button
              type="button"
              id="toggle-all-hours-btn"
              onClick={allExpanded ? collapseAll : expandAll}
              className="text-xxs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              {allExpanded ? (
                <>
                  <Icons.Minimize2 className="h-3 w-3" />
                  Collapse Non-Commute
                </>
              ) : (
                <>
                  <Icons.Maximize2 className="h-3 w-3" />
                  Expand All Hours
                </>
              )}
            </button>
          )}
          <span className="text-xxs font-medium text-slate-400 flex items-center gap-1 select-none">
            <Icons.MoveHorizontal className="h-3 w-3" />
            Scroll horizontally
          </span>
        </div>
      </div>

      {/* Timeline Scrollable Strip */}
      <div className="w-full overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-slate-100">
        <div className="flex gap-3 min-w-max items-stretch">
          {daytimeHours.map((item, idx) => {
            const hr = getHourNumber(item.time);
            const isAMCommute = hr === preferences.morningCommuteHour;
            const isPMCommute = hr === preferences.eveningCommuteHour;
            const isCommuteHour = isAMCommute || isPMCommute;

            const isExpanded = isCommuteHour || expandedHours.includes(item.time);
            const weatherInfo = getWMOInfo(item.weatherCode);

            if (!isExpanded) {
              // Shrunk (collapsed) card
              return (
                <button
                  type="button"
                  key={`${item.time}-${idx}`}
                  id={`hour-shrunk-${hr}-btn`}
                  onClick={() => toggleHour(item.time)}
                  title={`Click to expand ${formatHourString(item.time)} details`}
                  className="w-14 border border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/10 rounded-xl p-2.5 flex flex-col items-center justify-between text-center transition-all cursor-pointer group shrink-0"
                >
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">
                    {formatHourString(item.time).replace(' ', '')}
                  </span>
                  
                  <div className="h-7 w-7 my-1.5 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 bg-slate-50 group-hover:bg-emerald-50/50 rounded-lg transition-colors">
                    <WeatherIcon name={weatherInfo.icon} className="h-4 w-4" />
                  </div>

                  <span className="text-xs font-semibold text-slate-500 font-mono group-hover:text-slate-800 transition-colors">
                    {Math.round(item.temp)}°
                  </span>
                  
                  <div className="mt-1 flex items-center justify-center text-[8px] text-slate-300 group-hover:text-emerald-500">
                    <Icons.Plus className="h-2 w-2" />
                  </div>
                </button>
              );
            }

            // Full Expanded Card (either commute hour or manually expanded by user)
            const activeCardBorder = isAMCommute
              ? 'border-amber-400 bg-amber-50/20 shadow-xs'
              : isPMCommute
              ? 'border-sky-400 bg-sky-50/20 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300';

            return (
              <div
                key={`${item.time}-${idx}`}
                className={`w-28 border rounded-xl p-3 flex flex-col items-center text-center transition-all shrink-0 ${activeCardBorder} ${
                  !isCommuteHour ? 'cursor-pointer hover:bg-slate-50/50' : ''
                }`}
                onClick={!isCommuteHour ? () => toggleHour(item.time) : undefined}
                title={!isCommuteHour ? 'Click to collapse details' : undefined}
              >
                {/* Commute Window Badge Indicator */}
                {isAMCommute && (
                  <span className="bg-amber-500 text-white text-xxs font-bold px-1.5 py-0.5 rounded-full mb-1.5 shrink-0 uppercase tracking-widest scale-90 select-none">
                    AM Ride
                  </span>
                )}
                {isPMCommute && (
                  <span className="bg-sky-500 text-white text-xxs font-bold px-1.5 py-0.5 rounded-full mb-1.5 shrink-0 uppercase tracking-widest scale-90 select-none">
                    PM Ride
                  </span>
                )}
                {!isCommuteHour && (
                  <button
                    type="button"
                    className="text-[9px] font-semibold text-slate-400 mb-1.5 flex items-center gap-0.5 hover:text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHour(item.time);
                    }}
                  >
                    Collapse
                  </button>
                )}

                <span className="text-xs font-bold text-slate-700 block mt-1">
                  {formatHourString(item.time)}
                </span>

                {/* Weather Icon */}
                <div className="h-10 w-10 my-2 flex items-center justify-center text-slate-500 bg-slate-50 rounded-lg">
                  <WeatherIcon name={weatherInfo.icon} className="h-5 w-5" />
                </div>

                {/* Weather Stats */}
                <span className="text-sm font-black text-slate-800 font-mono">
                  {Math.round(item.temp)}°{preferences.tempUnit}
                </span>

                {/* Rain Probability Indicator */}
                <div className="flex items-center gap-0.5 text-xxs font-bold text-blue-500 mt-1.5">
                  <Icons.CloudRain className="h-2.5 w-2.5 shrink-0" />
                  <span>{item.rainProbability}%</span>
                </div>

                {/* Wind Speed Indicator */}
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 mt-1" title={`Wind direction: ${item.windDirection}°`}>
                  <Icons.Wind className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                  <span className="font-mono">
                    {Math.round(item.windSpeed)}{preferences.windUnit}
                  </span>
                  <span className="font-bold text-slate-500 scale-90">{getCardinalDirection(item.windDirection)}</span>
                  <div 
                    className="inline-flex items-center justify-center shrink-0 w-3 h-3"
                    style={{ transform: `rotate(${(item.windDirection + 180) % 360}deg)` }}
                  >
                    <Icons.ArrowUp className="h-2 w-2 text-slate-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
