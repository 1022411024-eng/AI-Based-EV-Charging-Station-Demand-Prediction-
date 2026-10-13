import React, { useState } from 'react';
import {
  Zap,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Activity,
  Sliders,
  Filter,
  Layers,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Station } from '../types';

interface GridHeadroomViewProps {
  stations: Station[];
  onSelectStation: (station: Station) => void;
}

export const GridHeadroomView: React.FC<GridHeadroomViewProps> = ({
  stations,
  onSelectStation,
}) => {
  const [curtailmentPct, setCurtailmentPct] = useState<number>(0);
  const [cityFilter, setCityFilter] = useState<string>('all');

  const filteredStations = stations.filter(
    (s) => cityFilter === 'all' || s.city.toLowerCase() === cityFilter.toLowerCase()
  );

  const cities = ['all', ...Array.from(new Set(stations.map((s) => s.city)))];

  // Calculate grid headroom metrics for each station
  const stationGridMetrics = filteredStations.map((stn) => {
    const rawCapacity = stn.max_grid_capacity_kw;
    const effectiveCapacity = Math.round(rawCapacity * (1 - curtailmentPct / 100));
    
    // Estimate peak load based on charger count and DC fast ratio
    const peakLoadKw = Math.min(
      effectiveCapacity,
      Math.round(stn.charger_count * stn.base_power * (stn.base_occupancy / 100) * 1.35)
    );
    const headroomKw = Math.max(0, effectiveCapacity - peakLoadKw);
    const utilizationPct = Math.round((peakLoadKw / effectiveCapacity) * 100);

    let status: 'Nominal' | 'Elevated' | 'Curtailment Danger' = 'Nominal';
    if (utilizationPct >= 85) status = 'Curtailment Danger';
    else if (utilizationPct >= 70) status = 'Elevated';

    return {
      ...stn,
      effectiveCapacity,
      peakLoadKw,
      headroomKw,
      utilizationPct,
      status,
    };
  });

  const totalCapacity = stationGridMetrics.reduce((acc, s) => acc + s.effectiveCapacity, 0);
  const totalPeakLoad = stationGridMetrics.reduce((acc, s) => acc + s.peakLoadKw, 0);
  const totalHeadroom = totalCapacity - totalPeakLoad;
  const avgUtilization = totalCapacity > 0 ? Math.round((totalPeakLoad / totalCapacity) * 100) : 0;
  const criticalCount = stationGridMetrics.filter((s) => s.status === 'Curtailment Danger').length;

  const chartData = stationGridMetrics.map((s) => ({
    name: s.city,
    station: s.name,
    capacity: s.effectiveCapacity,
    peak_load: s.peakLoadKw,
    headroom: s.headroomKw,
    utilization: s.utilizationPct,
  }));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={20} className="text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Regional Substation Grid Headroom</h2>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs font-mono text-amber-400">Transformer Capacity & Thermal Monitoring</span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-time interconnection headroom, transformer load factors, and upstream utility curtailment thresholds across metropolitan EV corridors.
          </p>
        </div>

        {/* City Filter & Curtailment Slider */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Filter size={13} className="text-slate-500" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer capitalize"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'All Metropolitan Hubs' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Interconnection Capacity</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {totalCapacity.toLocaleString()} kW
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Total nameplate headroom</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Projected Peak Load</div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
            {totalPeakLoad.toLocaleString()} kW
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Concurrent charging draw</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">System Headroom Margin</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {totalHeadroom.toLocaleString()} kW
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{100 - avgUtilization}% safety buffer</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Capacity Utilization</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {avgUtilization}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Average transformer factor</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Thermal Risk Alerts</div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {criticalCount} Hubs
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {criticalCount > 0 ? 'Exceeding 85% threshold' : 'All feeders nominal'}
          </div>
        </div>
      </div>

      {/* Interactive Regional Curtailment Stress Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Grid Interconnection Curtailment Stress Test</h3>
          </div>
          <span className="text-xs font-mono text-amber-400 font-bold tabular-nums">
            {curtailmentPct}% Power Reduction
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Simulate upstream transmission constraints or utility emergency demand-response curtailment across all regional EV charging substations.
        </p>
        <div className="pt-2">
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={curtailmentPct}
            onChange={(e) => setCurtailmentPct(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>0% (Full Interconnection Capacity)</span>
            <span>25% (Moderate Feeder Restriction)</span>
            <span>50% (Extreme Brownout Emergency)</span>
          </div>
        </div>
      </div>

      {/* Substation Comparison Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Substation Capacity vs Projected Peak Draw</h3>
          <span className="text-xs text-slate-400 font-mono">Units: Kilowatts (kW)</span>
        </div>

        <div className="h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="station" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" unit=" kW" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#1e293b',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="capacity" name="Available Interconnection (kW)" fill="#334155" radius={[4, 4, 0, 0]} />
              <Bar dataKey="peak_load" name="Projected Peak Draw (kW)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="headroom" name="Remaining Headroom (kW)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High-Density Substation Telemetry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Substation Feeder Headroom Roster</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Charging Hub</th>
                <th className="py-2.5 px-3">Metropolitan City</th>
                <th className="py-2.5 px-3 text-right">Effective Cap</th>
                <th className="py-2.5 px-3 text-right">Peak Load</th>
                <th className="py-2.5 px-3 text-right">Headroom</th>
                <th className="py-2.5 px-3 w-36">Headroom Bar</th>
                <th className="py-2.5 px-3 text-right">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {stationGridMetrics.map((stn) => (
                <tr key={stn.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-sans font-medium text-white truncate max-w-[180px]">
                    {stn.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">
                    {stn.city}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300 font-semibold">
                    {stn.effectiveCapacity.toLocaleString()} kW
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-400 font-semibold">
                    {stn.peakLoadKw.toLocaleString()} kW
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                    {stn.headroomKw.toLocaleString()} kW
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          stn.status === 'Curtailment Danger'
                            ? 'bg-rose-500'
                            : stn.status === 'Elevated'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, stn.utilizationPct)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        stn.status === 'Curtailment Danger'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : stn.status === 'Elevated'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {stn.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      onClick={() => onSelectStation(stn)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                      Inspect Hub →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
