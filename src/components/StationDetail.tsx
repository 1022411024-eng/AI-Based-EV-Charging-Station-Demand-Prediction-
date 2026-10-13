import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
import {
  Zap,
  Activity,
  ShieldCheck,
  TrendingUp,
  Download,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Calendar,
  Clock,
  BatteryCharging,
  DollarSign,
  CloudSun,
} from 'lucide-react';
import { Station, PredictionResponse, ScenarioConfig } from '../types';

interface StationDetailProps {
  station: Station;
  predictionData: PredictionResponse | null;
  loading: boolean;
  currentScenario: ScenarioConfig;
  onRefreshPrediction: () => void;
}

export const StationDetail: React.FC<StationDetailProps> = ({
  station,
  predictionData,
  loading,
  currentScenario,
  onRefreshPrediction,
}) => {
  const [activeTab, setActiveTab] = useState<'24h' | '7d'>('24h');
  const [metricView, setMetricView] = useState<'occupancy' | 'power' | 'stress' | 'tariff'>('occupancy');

  const handleExportData = (format: 'csv' | 'json') => {
    if (!predictionData) return;

    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(predictionData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${station.name.replace(/\s+/g, '_')}_demand_forecast.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      let csvContent = 'data:text/csv;charset=utf-8,Time,Hour,Occupancy_Pct,Power_kW,Active_Ports,Grid_Stress_Pct,Tariff_Per_kWh\n';
      predictionData.predictions.forEach((row) => {
        csvContent += `${row.time},${row.hour},${row.occupancy},${row.power_kw},${row.active_ports},${row.grid_stress_pct},${row.estimated_cost_per_kwh}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${station.name.replace(/\s+/g, '_')}_hourly_forecast.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const metrics = predictionData?.metrics;
  const aiAnalysis = predictionData?.ai_analysis;

  // Chart data formatting for 24h
  const chartData24h =
    predictionData?.predictions.map((p, idx) => ({
      time: p.time,
      hour: p.hour,
      predicted_occupancy: p.occupancy,
      historical_occupancy: predictionData.historical[idx]?.occupancy || 0,
      predicted_power: p.power_kw,
      historical_power: predictionData.historical[idx]?.power_kw || 0,
      grid_stress: p.grid_stress_pct,
      tariff: p.estimated_cost_per_kwh,
      active_ports: p.active_ports,
      grid_capacity: station.max_grid_capacity_kw,
    })) || [];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Station Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white tracking-tight">{station.name}</h2>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-mono">{station.city}</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">{station.address}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-2 font-mono tabular-nums">
            <span>{station.charger_count} Total Ports ({station.dc_fast_count}x DC Fast, {station.ac_level2_count}x AC Level 2)</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Interconnection: {station.max_grid_capacity_kw} kW</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Weather: {station.temperature}°C, {station.weather_condition}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center border border-slate-800 rounded-lg overflow-hidden bg-slate-950 text-xs">
            <button
              onClick={() => handleExportData('csv')}
              className="px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1"
              title="Download CSV Forecast"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-800" />
            <button
              onClick={() => handleExportData('json')}
              className="px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1"
              title="Download JSON Payload"
            >
              <Download size={13} />
              <span>JSON</span>
            </button>
          </div>

          <button
            onClick={onRefreshPrediction}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Activity size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Evaluating...' : 'Recalculate'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Peak Demand Occupancy</span>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {metrics ? `${metrics.peakOccupancy}%` : '—'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Avg: {metrics ? `${metrics.avgOccupancy}%` : '—'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Commuter rush window surge
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Peak Substation Load</span>
            <Zap size={14} className="text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {metrics ? `${metrics.peakPowerKw} kW` : '—'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono tabular-nums">
            {metrics
              ? `${Math.round((metrics.peakPowerKw / metrics.effectiveGridCapacity) * 100)}% Substation Headroom`
              : '—'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>24h Energy & Revenue</span>
            <DollarSign size={14} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {metrics ? `$${metrics.estimatedRevenue.toLocaleString()}` : '—'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono tabular-nums">
            {metrics ? `${metrics.totalDailyKwh.toLocaleString()} kWh Projected` : '—'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Clean Mobility Offset</span>
            <BatteryCharging size={14} className="text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {metrics ? `${metrics.carbonOffsetKg.toLocaleString()} kg` : '—'}
            </span>
            <span className="text-xs text-slate-400">CO₂e</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Avoided tailpipe ICE emissions
          </div>
        </div>
      </div>

      {/* Gemini AI Grid Intelligence Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Gemini AI Demand & Grid Intelligence</h3>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs font-mono text-slate-400">gemini-3.8-flash</span>
          </div>
          {currentScenario.id !== 'baseline' && (
            <span className="text-xs font-mono text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded">
              Scenario: {currentScenario.name}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Activity className="animate-spin text-emerald-400" size={20} />
            <span>Generating Gemini dispatch synthesis and grid headroom advisory...</span>
          </div>
        ) : aiAnalysis ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1.5">
              <span className="font-semibold text-emerald-300 block">Executive Demand Forecast</span>
              <p className="text-slate-300 leading-relaxed">{aiAnalysis.summary}</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1.5">
              <span className="font-semibold text-amber-300 block">Substation Headroom & Thermal Advisory</span>
              <p className="text-slate-300 leading-relaxed">{aiAnalysis.grid_advisory}</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1.5">
              <span className="font-semibold text-sky-300 block">Dispatch & Tariff Steering Strategy</span>
              <p className="text-slate-300 leading-relaxed">{aiAnalysis.dispatch_recommendation}</p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1.5">
              <span className="font-semibold text-purple-300 block">Weather & Thermal Battery Dynamic</span>
              <p className="text-slate-300 leading-relaxed">{aiAnalysis.weather_impact}</p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-slate-500">
            No AI synthesis generated. Click "Recalculate" to invoke model.
          </div>
        )}
      </div>

      {/* Demand Forecast Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">Demand Forecast Modeling</h3>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('24h')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === '24h'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                24-Hour Horizon
              </button>
              <button
                onClick={() => setActiveTab('7d')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === '7d'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                7-Day Weekly Trend
              </button>
            </div>
          </div>

          {activeTab === '24h' && (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setMetricView('occupancy')}
                className={`px-2 py-0.5 rounded transition ${
                  metricView === 'occupancy' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Occupancy %
              </button>
              <button
                onClick={() => setMetricView('power')}
                className={`px-2 py-0.5 rounded transition ${
                  metricView === 'power' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Power (kW)
              </button>
              <button
                onClick={() => setMetricView('stress')}
                className={`px-2 py-0.5 rounded transition ${
                  metricView === 'stress' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Grid Stress %
              </button>
              <button
                onClick={() => setMetricView('tariff')}
                className={`px-2 py-0.5 rounded transition ${
                  metricView === 'tariff' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tariff ($)
              </button>
            </div>
          )}
        </div>

        {/* Chart View */}
        <div className="min-h-[360px] w-full pt-2">
          {loading || chartData24h.length === 0 ? (
            <div className="h-[340px] flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
              <Activity className="animate-spin text-emerald-400" size={18} />
              <span>Simulating charging curves...</span>
            </div>
          ) : activeTab === '24h' ? (
            <ResponsiveContainer width="100%" height={340}>
              {metricView === 'occupancy' ? (
                <LineChart data={chartData24h} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#1e293b',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <ReferenceLine y={80} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Congestion Threshold (80%)', fill: '#f43f5e', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="predicted_occupancy"
                    name="Predicted Occupancy (%)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="historical_occupancy"
                    name="Historical Baseline (%)"
                    stroke="#64748b"
                    strokeWidth={1.8}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              ) : metricView === 'power' ? (
                <AreaChart data={chartData24h} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
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
                  <ReferenceLine
                    y={station.max_grid_capacity_kw}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{ value: `Grid Cap (${station.max_grid_capacity_kw} kW)`, fill: '#ef4444', fontSize: 10 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted_power"
                    name="Power Draw (kW)"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.15}
                    strokeWidth={2.2}
                  />
                  <Line
                    type="monotone"
                    dataKey="historical_power"
                    name="Historical Power (kW)"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </AreaChart>
              ) : metricView === 'stress' ? (
                <AreaChart data={chartData24h} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#1e293b',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Curtailment Danger (85%)', fill: '#ef4444', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="grid_stress"
                    name="Substation Stress Index (%)"
                    stroke="#ec4899"
                    fill="#ec4899"
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData24h} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" unit=" $" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#1e293b',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line
                    type="stepAfter"
                    dataKey="tariff"
                    name="Dynamic Tariff Rate ($/kWh)"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={predictionData?.weekly_predictions || []}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day_name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="avg_occupancy" name="Avg Occupancy (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="peak_occupancy" name="Peak Occupancy (%)" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Hourly Dispatch Schedule Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-white">24-Hour Dispatch & Substation Schedule</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {station.charger_count} Available Ports
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Hour Window</th>
                <th className="py-2.5 px-3">Occupancy Curve</th>
                <th className="py-2.5 px-3 text-right">Occupancy %</th>
                <th className="py-2.5 px-3 text-right">Active Ports</th>
                <th className="py-2.5 px-3 text-right">Power Draw</th>
                <th className="py-2.5 px-3 text-right">Grid Stress</th>
                <th className="py-2.5 px-3 text-right">Tariff Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {predictionData?.predictions.map((p) => {
                const isPeak = p.occupancy >= 80;
                return (
                  <tr
                    key={p.time}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isPeak ? 'bg-rose-500/5' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-300 font-medium">{p.time}</td>
                    <td className="py-2 px-3 w-40">
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            p.occupancy >= 80
                              ? 'bg-rose-500'
                              : p.occupancy >= 60
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${p.occupancy}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-200">
                      {p.occupancy}%
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400">
                      {p.active_ports} / {station.charger_count}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">
                      {p.power_kw} kW
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span
                        className={
                          p.grid_stress_pct >= 85
                            ? 'text-rose-400 font-semibold'
                            : p.grid_stress_pct >= 70
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }
                      >
                        {p.grid_stress_pct}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">
                      ${p.estimated_cost_per_kwh.toFixed(2)}/kWh
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
