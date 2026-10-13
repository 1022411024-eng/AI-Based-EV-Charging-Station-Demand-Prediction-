import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Station } from '../types';

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStationAdded: (station: Station) => void;
}

export const AddStationModal: React.FC<AddStationModalProps> = ({
  isOpen,
  onClose,
  onStationAdded,
}) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('San Francisco');
  const [address, setAddress] = useState('');
  const [chargerCount, setChargerCount] = useState(16);
  const [dcFastCount, setDcFastCount] = useState(12);
  const [baseOccupancy, setBaseOccupancy] = useState(65);
  const [basePower, setBasePower] = useState(120);
  const [maxGridCapacity, setMaxGridCapacity] = useState(1800);
  const [weatherCondition, setWeatherCondition] = useState<Station['weather_condition']>('Clear');
  const [temperature, setTemperature] = useState(20);
  const [peakTariff, setPeakTariff] = useState(0.45);
  const [offPeakTariff, setOffPeakTariff] = useState(0.20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a station name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          city,
          address: address.trim() || `${name.trim()}, ${city}`,
          charger_count: chargerCount,
          dc_fast_count: dcFastCount,
          base_occupancy: baseOccupancy,
          base_power: basePower,
          max_grid_capacity_kw: maxGridCapacity,
          weather_condition: weatherCondition,
          temperature,
          is_raining: weatherCondition === 'Rainy',
          peak_tariff_per_kwh: peakTariff,
          off_peak_tariff_per_kwh: offPeakTariff,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create station');
      }

      onStationAdded(data.station);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating station');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">Register EV Charging Hub</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure grid interconnection and charger specifications
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Station Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Presidio Gateway Mobility Depot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Metropolitan City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="San Francisco">San Francisco</option>
                <option value="San Jose">San Jose</option>
                <option value="Oakland">Oakland</option>
                <option value="Seattle">Seattle</option>
                <option value="Austin">Austin</option>
                <option value="New York">New York</option>
                <option value="Chicago">Chicago</option>
                <option value="Los Angeles">Los Angeles</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Street Address</label>
            <input
              type="text"
              placeholder="e.g. 100 Marina Blvd, San Francisco, CA"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Total Chargers</label>
              <input
                type="number"
                min="2"
                max="100"
                value={chargerCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setChargerCount(val);
                  setDcFastCount(Math.min(val, Math.round(val * 0.75)));
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">DC Fast (150-350kW)</label>
              <input
                type="number"
                min="0"
                max={chargerCount}
                value={dcFastCount}
                onChange={(e) => setDcFastCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Grid Headroom (kW)</label>
              <input
                type="number"
                min="100"
                max="10000"
                step="50"
                value={maxGridCapacity}
                onChange={(e) => setMaxGridCapacity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Base Occupancy Rate (%)</label>
              <input
                type="number"
                min="10"
                max="95"
                value={baseOccupancy}
                onChange={(e) => setBaseOccupancy(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Avg Power per Port (kW)</label>
              <input
                type="number"
                min="20"
                max="350"
                value={basePower}
                onChange={(e) => setBasePower(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Weather Condition</label>
              <select
                value={weatherCondition}
                onChange={(e) => setWeatherCondition(e.target.value as Station['weather_condition'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Clear">Clear (Nominal)</option>
                <option value="Rainy">Rainy (Higher dwell)</option>
                <option value="Overcast">Overcast</option>
                <option value="Extreme Heat">Extreme Heat (HVAC load)</option>
                <option value="Snow">Snow</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Ambient Temp (°C)</label>
              <input
                type="number"
                min="-20"
                max="50"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Peak Tariff ($/kWh)</label>
              <input
                type="number"
                step="0.01"
                min="0.10"
                max="1.50"
                value={peakTariff}
                onChange={(e) => setPeakTariff(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Off-Peak Tariff ($/kWh)</label>
              <input
                type="number"
                step="0.01"
                min="0.05"
                max="1.00"
                value={offPeakTariff}
                onChange={(e) => setOffPeakTariff(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition flex items-center gap-1.5"
            >
              <Plus size={14} />
              {loading ? 'Registering...' : 'Save Station'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
