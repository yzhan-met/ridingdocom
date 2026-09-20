import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Compass, Check, Loader2 } from 'lucide-react';
import { LocationData } from '../types';

interface LocationSelectorProps {
  currentLocation: LocationData;
  onLocationSelect: (location: LocationData) => void;
}

const PRESET_CITIES: LocationData[] = [
  { name: 'Wellington', latitude: -41.2865, longitude: 174.7762, admin1: 'Wellington', country: 'New Zealand' },
  { name: 'Amsterdam', latitude: 52.3676, longitude: 4.9041, admin1: 'North Holland', country: 'Netherlands' },
  { name: 'San Francisco', latitude: 37.7749, longitude: -122.4194, admin1: 'California', country: 'United States' },
  { name: 'Seattle', latitude: 47.6062, longitude: -122.3321, admin1: 'Washington', country: 'United States' },
  { name: 'London', latitude: 51.5074, longitude: -0.1278, admin1: 'England', country: 'United Kingdom' },
  { name: 'Sydney', latitude: -33.8688, longitude: 151.2093, admin1: 'New South Wales', country: 'Australia' },
];

export default function LocationSelector({ currentLocation, onLocationSelect }: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch cities when search query changes (debounced-ish via state or triggered on submit/typing)
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/geocode-search?name=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const formatted: LocationData[] = data.results.map((item: any) => ({
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
            admin1: item.admin1 || item.timezone,
            country: item.country,
          }));
          setSearchResults(formatted);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
        setError('Failed to find cities. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Request browser geolocation
  const handleGeolocation = () => {
    setIsLocating(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode using Open-Meteo or free nominatim API to get a friendly name
          const response = await fetch(
            `/api/geocode-reverse?lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || 'Your Location';
          const state = data.address.state || '';
          const country = data.address.country || '';

          onLocationSelect({
            name: city,
            latitude,
            longitude,
            admin1: state,
            country,
          });
          setSearchQuery('');
          setShowDropdown(false);
        } catch {
          // Fallback if reverse geocode fails
          onLocationSelect({
            name: 'GPS Coordinates',
            latitude,
            longitude,
            admin1: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
            country: 'Detected Location',
          });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        if (err.code === 1) {
          setError('Location permission denied. Please search manually.');
        } else {
          setError('Unable to retrieve location. Please search manually.');
        }
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-200">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="location-picker-heading" className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Commute Location
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-5 w-5 text-emerald-500 shrink-0" />
              <span className="font-semibold text-slate-800 text-lg">
                {currentLocation.name}
              </span>
              {(currentLocation.admin1 || currentLocation.country) && (
                <span className="text-slate-400 text-sm">
                  ({[currentLocation.admin1, currentLocation.country].filter(Boolean).join(', ')})
                </span>
              )}
            </div>
          </div>

          <button
            id="gps-btn"
            onClick={handleGeolocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 disabled:opacity-60 transition-colors"
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Compass className="h-3.5 w-3.5" />
            )}
            Use My GPS
          </button>
        </div>

        {/* Search bar with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="city-search"
              type="text"
              placeholder="Search cities worldwide (e.g. Amsterdam, Tokyo)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 text-sm transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 animate-spin" />
            )}
          </div>

          {error && (
            <p className="text-xs text-rose-500 mt-1.5 px-1">{error}</p>
          )}

          {/* Dropdown list */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden divide-y divide-slate-50 max-h-60 overflow-y-auto">
              {searchResults.map((loc, idx) => (
                <button
                  key={`${loc.latitude}-${loc.longitude}-${idx}`}
                  onClick={() => {
                    onLocationSelect(loc);
                    setSearchQuery('');
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between text-sm transition-colors text-slate-700 font-medium"
                >
                  <div className="flex flex-col">
                    <span>{loc.name}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {loc.latitude.toFixed(2)}°N, {loc.longitude.toFixed(2)}°E
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick presets */}
        <div>
          <div className="flex flex-wrap gap-2">
            {PRESET_CITIES.map((city) => {
              const isSelected = currentLocation.name.toLowerCase() === city.name.toLowerCase();
              return (
                <button
                  key={city.name}
                  id={`preset-${city.name.toLowerCase()}`}
                  onClick={() => onLocationSelect(city)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-slate-800 text-white shadow-sm scale-102'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-emerald-400" />}
                  {city.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
