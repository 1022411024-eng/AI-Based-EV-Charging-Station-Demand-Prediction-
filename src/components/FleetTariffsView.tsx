import React, { useState } from 'react';
import {
  DollarSign,
  TrendingDown,
  Truck,
  BatteryCharging,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Station } from '../types';

interface FleetTariffsViewProps {
  stations: Station[];
  onSelectStation: (station: Station) => void;
}

interface FleetArchetype {
  id: string;
  name: string;
  batteryKwh: number;
  maxChargeKw: number;
  description: string;
}

const FLEET_ARCHETYPES: FleetArchetype[] = [
  {
    id: 'delivery_van',
    name: 'Last-Mile Delivery Van',
    batteryKwh: 68,
    maxChargeKw: 120,
    description: 'Urban courier and logistics vehicles with 150-mile daily routing.',
  },
  {
    id: 'transit_shuttle',
    name: 'Corporate & Transit Shuttle',
    batteryKwh: 110,
    maxChargeKw: 150,
    description: 'Metropolitan passenger transport shuttles with scheduled route intervals.',
  },
  {
    id: 'depot_truck',
    name: 'Class 6 Medium Duty Depot Truck',
    batteryKwh: 220,
    maxChargeKw: 250,
    description: 'Regional distribution freight trucks requiring high-power overnight charging.',
  },
  {
    id: 'rideshare',
    name: 'Ride-Hailing Fleet Crossover',
    batteryKwh: 75,
    maxChargeKw: 150,
    description: 'High-turnaround mobility driver fleets operating in urban cores.',
  },
];

export const FleetTariffsView: React.FC<FleetTariffsViewProps> = ({
  stations,
  onSelectStation,
}) => {
  const [selectedArchetype, setSelectedArchetype] = useState<FleetArchetype>(FLEET_ARCHETYPES[0]);
  const [fleetSize, setFleetSize] = useState<number>(15);
  const [socChargePct, setSocChargePct] = useState<number>(70); // 70% replenish
  const [selectedStationId, setSelectedStationId] = useState<string>(stations[0]?.id || 'stn_001');

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  const peakRate = selectedStation?.peak_tariff_per_kwh || 0.45;
  const offPeakRate = selectedStation?.off_peak_tariff_per_kwh || 0.20;

  // Energy needed per vehicle in kWh
  const energyPerVehicle = (selectedArchetype.batteryKwh * socChargePct) / 100;
  const totalFleetEnergyKwh = Math.round(energyPerVehicle * fleetSize);

  // Costs
  const peakTotalCost = Math.round(totalFleetEnergyKwh * peakRate);
  const offPeakTotalCost = Math.round(totalFleetEnergyKwh * offPeakRate);
  const costSavings = peakTotalCost - offPeakTotalCost;
  const savingsPct = peakTotalCost > 0 ? Math.round((costSavings / peakTotalCost) * 100) : 0;
  const monthlySavings = costSavings * 30;

  // 24-hour tariff curve data
  const tariffHourlyCurve = Array.from({ length: 24 }).map((_, hour) => {
    const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 20);
    const rate = isPeak ? peakRate : offPeakRate;
    const timeLabel = `${String(hour).padStart(2, '0')}:00`;

    return {
      hour: timeLabel,
      rate,
      isPeak,
      isSuperOffPeak: hour >= 0 && hour <= 5,
    };
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={20} className="text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Commercial Fleet Tariff & TOU Optimization</h2>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs font-mono text-emerald-400">Time-of-Use Dispatch Economics</span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Model charging session costs, evaluate peak versus off-peak rate arbitration, and schedule corporate fleet charging windows for maximum operational savings.
          </p>
        </div>

        {/* Station Selector */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs shrink-0">
          <span className="text-slate-400">Station Tariff:</span>
          <select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">On-Peak Rate</div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">
            ${peakRate.toFixed(2)}
            <span className="text-xs font-normal text-slate-400 font-sans">/kWh</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Commuter transit hours</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Off-Peak Rate</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            ${offPeakRate.toFixed(2)}
            <span className="text-xs font-normal text-slate-400 font-sans">/kWh</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Overnight & midday base</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Single Session Savings</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            ${costSavings.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 font-mono">
            {savingsPct}% Cost Reduction
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Monthly Fleet Benefit</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            ${monthlySavings.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">For {fleetSize} active vehicles</div>
        </div>
      </div>

      {/* Fleet Cost Optimization Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vehicle Archetype & Slider Controls */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Fleet Profile & Charging Parameters</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {totalFleetEnergyKwh.toLocaleString()} kWh Requirement
            </span>
          </div>

          {/* Archetype Selector Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {FLEET_ARCHETYPES.map((arch) => {
              const isSelected = selectedArchetype.id === arch.id;
              return (
                <button
                  key={arch.id}
                  onClick={() => setSelectedArchetype(arch)}
                  className={`p-3 rounded-lg border text-left transition ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold text-white truncate">{arch.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {arch.batteryKwh} kWh Pack · {arch.maxChargeKw} kW DC
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                    {arch.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sliders */}
          <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Active Fleet Size (Vehicles)</span>
                <span className="font-mono text-emerald-400 font-bold tabular-nums">
                  {fleetSize} Vehicles
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={fleetSize}
                onChange={(e) => setFleetSize(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Replenishment Depth of Discharge (SOC %)</span>
                <span className="font-mono text-sky-400 font-bold tabular-nums">
                  {socChargePct}% Recharge ({Math.round(energyPerVehicle)} kWh / vehicle)
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={socChargePct}
                onChange={(e) => setSocChargePct(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Economic Comparison Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-slate-950 rounded-lg border border-rose-900/40">
              <span className="text-[11px] text-slate-400 block mb-0.5">Peak Window Dispatch</span>
              <div className="text-xl font-bold text-rose-400 font-mono tabular-nums">
                ${peakTotalCost.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Unmanaged afternoon charging</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-emerald-900/40">
              <span className="text-[11px] text-slate-400 block mb-0.5">Smart Off-Peak Window</span>
              <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
                ${offPeakTotalCost.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold">
                Saves ${costSavings.toLocaleString()} per batch
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 24h Diurnal Tariff Schedule Curve */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-sky-400" />
              <h3 className="text-sm font-semibold text-white">24-Hour Time-of-Use Rate Profile</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Peak Windows: 08:00–11:00 & 17:00–20:00
            </span>
          </div>

          <div className="h-[280px] w-full pt-1">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={tariffHourlyCurve} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" unit=" $" tick={{ fontSize: 11 }} domain={[0, 0.65]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area
                  type="stepAfter"
                  dataKey="rate"
                  name="Effective Tariff ($/kWh)"
                  stroke="#38bdf8"
                  fill="#38bdf8"
                  fillOpacity={0.15}
                  strokeWidth={2.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
            <Sparkles size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong className="text-white">Fleet Scheduling Policy:</strong> Shifting {fleetSize} {selectedArchetype.name} vehicles to plug in post-22:00 saves your fleet an estimated <strong>${monthlySavings.toLocaleString()} monthly</strong> while protecting municipal substation transformers from coincident commuter load.
            </p>
          </div>
        </div>
      </div>

      {/* Station Tariff Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Metropolitan Charging Corridors Rate Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Station Name</th>
                <th className="py-2.5 px-3">Metropolitan City</th>
                <th className="py-2.5 px-3 text-right">Ports (DC Fast)</th>
                <th className="py-2.5 px-3 text-right">Peak Rate</th>
                <th className="py-2.5 px-3 text-right">Off-Peak Rate</th>
                <th className="py-2.5 px-3 text-right">Spread Delta</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {stations.map((stn) => {
                const delta = stn.peak_tariff_per_kwh - stn.off_peak_tariff_per_kwh;
                return (
                  <tr key={stn.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-medium text-white truncate max-w-[200px]">
                      {stn.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans">{stn.city}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {stn.charger_count} ({stn.dc_fast_count} DC)
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-400 font-semibold">
                      ${stn.peak_tariff_per_kwh.toFixed(2)}/kWh
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                      ${stn.off_peak_tariff_per_kwh.toFixed(2)}/kWh
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200">
                      -${delta.toFixed(2)}/kWh
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        onClick={() => {
                          setSelectedStationId(stn.id);
                          onSelectStation(stn);
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                      >
                        Select →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
