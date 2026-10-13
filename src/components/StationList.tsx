import React, { useState } from 'react';
import { Search, MapPin, Zap, Thermometer, CloudRain, Plus, Upload, Filter } from 'lucide-react';
import { Station } from '../types';

interface StationListProps {
  stations: Station[];
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
  onOpenAddModal: () => void;
  onOpenCsvModal: () => void;
}

export const StationList: React.FC<StationListProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  onOpenAddModal,
  onOpenCsvModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');

  const cities = ['All', ...Array.from(new Set(stations.map((s) => s.city)))];

  const filtered = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = selectedCity === 'All' || station.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <aside className="w-full lg:w-96 bg-slate-900/60 border-r border-slate-800 flex flex-col shrink-0 h-full">
      {/* Search and Action Bar */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Charging Hubs</span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">({filtered.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenCsvModal}
              title="Bulk Ingest CSV"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Upload CSV records"
            >
              <Upload size={14} />
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-2.5 py-1 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition flex items-center gap-1"
            >
              <Plus size={13} />
              <span>Add Station</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
          <input
            type="text"
            placeholder="Search by name, city, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* City Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                selectedCity === city
                  ? 'bg-slate-800 text-white font-medium border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Station List View */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No charging stations match your current search criteria.
          </div>
        ) : (
          filtered.map((station) => {
            const isSelected = selectedStation?.id === station.id;
            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station)}
                className={`p-3 rounded-xl border cursor-pointer transition text-left ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-xs'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="font-semibold text-xs text-white truncate max-w-[200px]">
                    {station.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                    <MapPin size={11} className="text-slate-500" />
                    {station.city}
                  </span>
                </div>

                {/* Clean unboxed metadata with separators */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums mb-2">
                  <span>{station.charger_count} Ports</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>{station.dc_fast_count} DC Fast</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>{station.max_grid_capacity_kw} kW Cap</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Thermometer size={12} className="text-slate-500" />
                      {station.temperature}°C
                    </span>
                    <span className="flex items-center gap-1">
                      <CloudRain size={12} className={station.is_raining ? 'text-sky-400' : 'text-slate-500'} />
                      {station.weather_condition}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300 font-mono">
                    <span className="text-[10px] text-slate-500">Peak:</span>
                    <span>${station.peak_tariff_per_kwh.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
