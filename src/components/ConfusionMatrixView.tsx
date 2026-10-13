import React, { useState, useEffect } from 'react';
import {
  Grid,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sliders,
  Filter,
  BarChart2,
  HelpCircle,
  RefreshCw,
  Target,
} from 'lucide-react';
import { ConfusionMatrixData, Station } from '../types';

interface ConfusionMatrixViewProps {
  stations: Station[];
}

export const ConfusionMatrixView: React.FC<ConfusionMatrixViewProps> = ({ stations }) => {
  const [data, setData] = useState<ConfusionMatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string>('all');
  const [threshold, setThreshold] = useState<number>(75);
  const [matrixType, setMatrixType] = useState<'3x3' | '2x2'>('3x3');

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/evaluation?station_id=${selectedStationId}&threshold=${threshold}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load evaluation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
  }, [selectedStationId, threshold]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Section Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={20} className="text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Model Accuracy & Confusion Matrix</h2>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs font-mono text-emerald-400">Demand Classification Evaluation</span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Statistical validation comparing model predictions against ground truth telemetry across test and validation splits.
          </p>
        </div>

        {/* Filter and Matrix Format Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setMatrixType('3x3')}
              className={`px-3 py-1 rounded-md transition ${
                matrixType === '3x3' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3×3 Multi-Tier
            </button>
            <button
              onClick={() => setMatrixType('2x2')}
              className={`px-3 py-1 rounded-md transition ${
                matrixType === '2x2' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2×2 Peak Congestion
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Filter size={13} className="text-slate-500" />
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Metropolitan Stations</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchEvaluation}
            disabled={loading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title="Refresh Evaluation"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Accuracy & Core Statistical KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Overall Accuracy</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {data ? `${(data.accuracy * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 font-mono">
            {data ? `${data.total_samples} samples` : '—'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Precision (Macro)</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {data ? `${(data.precision_macro * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Positive predictive value</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Recall (Macro)</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {data ? `${(data.recall_macro * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">True positive rate</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">F1-Score</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {data ? `${(data.f1_macro * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Harmonic mean P/R</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">MAE (Occupancy)</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {data ? `±${data.mae_occupancy}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Mean absolute error</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">RMSE</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {data ? `${data.rmse_occupancy}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Root mean sq. error</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">R² Goodness</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {data ? data.r2_score.toFixed(3) : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Variance explained</div>
        </div>
      </div>

      {/* Main Confusion Matrix Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Matrix Visualization Column */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                {matrixType === '3x3' ? 'Multi-Class Demand Confusion Matrix' : 'Binary Peak Congestion Matrix'}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Rows: Actual Ground Truth · Columns: Predicted
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              Computing confusion matrix counts...
            </div>
          ) : data && matrixType === '3x3' ? (
            <div className="space-y-4 pt-2">
              {/* Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse font-mono">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-slate-500 font-sans font-normal w-36">
                        Actual \ Predicted
                      </th>
                      {data.labels.map((colLabel) => (
                        <th key={colLabel} className="p-2.5 text-slate-300 font-medium bg-slate-950/60 border border-slate-800">
                          {colLabel}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.matrix.map((row, rowIdx) => {
                      const actualLabel = data.labels[rowIdx];
                      const rowTotal = row.reduce((a, b) => a + b, 0);

                      return (
                        <tr key={actualLabel}>
                          <td className="p-2.5 text-left text-slate-300 font-sans font-medium bg-slate-950/40 border border-slate-800">
                            {actualLabel}
                          </td>
                          {row.map((val, colIdx) => {
                            const isDiagonal = rowIdx === colIdx;
                            const pctOfRow = rowTotal > 0 ? Math.round((val / rowTotal) * 100) : 0;

                            return (
                              <td
                                key={colIdx}
                                className={`p-4 border border-slate-800 transition-all ${
                                  isDiagonal
                                    ? 'bg-emerald-500/15 text-emerald-300 font-bold'
                                    : val > 0
                                    ? 'bg-rose-500/10 text-rose-300'
                                    : 'bg-slate-950/30 text-slate-500'
                                }`}
                              >
                                <div className="text-lg font-bold tabular-nums">{val}</div>
                                <div className="text-[10px] opacity-75 font-sans mt-0.5">
                                  {pctOfRow}% of actual
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend & Guide */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
                    <span>Diagonal (True Positive Matches)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500/15 border border-rose-500/40" />
                    <span>Off-Diagonal (Misclassifications)</span>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  Total Validated Hours: {data.total_samples}
                </span>
              </div>
            </div>
          ) : data && matrixType === '2x2' ? (
            <div className="space-y-4 pt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse font-mono">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-slate-500 font-sans font-normal w-40">
                        Actual \ Predicted
                      </th>
                      <th className="p-3 text-slate-300 font-medium bg-slate-950 border border-slate-800">
                        Predicted Peak (≥{threshold}%)
                      </th>
                      <th className="p-3 text-slate-300 font-medium bg-slate-950 border border-slate-800">
                        Predicted Normal (&lt;{threshold}%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 text-left text-slate-300 font-sans font-medium bg-slate-950 border border-slate-800">
                        Actual Peak (≥{threshold}%)
                      </td>
                      <td className="p-5 bg-emerald-500/15 text-emerald-300 border border-slate-800">
                        <div className="text-xl font-bold tabular-nums">{data.binary_matrix.tp}</div>
                        <div className="text-[11px] font-sans text-emerald-400 mt-1 font-semibold">True Positive (TP)</div>
                      </td>
                      <td className="p-5 bg-rose-500/10 text-rose-300 border border-slate-800">
                        <div className="text-xl font-bold tabular-nums">{data.binary_matrix.fn}</div>
                        <div className="text-[11px] font-sans text-rose-400 mt-1 font-semibold">False Negative (FN)</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-left text-slate-300 font-sans font-medium bg-slate-950 border border-slate-800">
                        Actual Normal (&lt;{threshold}%)
                      </td>
                      <td className="p-5 bg-rose-500/10 text-rose-300 border border-slate-800">
                        <div className="text-xl font-bold tabular-nums">{data.binary_matrix.fp}</div>
                        <div className="text-[11px] font-sans text-rose-400 mt-1 font-semibold">False Positive (FP)</div>
                      </td>
                      <td className="p-5 bg-emerald-500/15 text-emerald-300 border border-slate-800">
                        <div className="text-xl font-bold tabular-nums">{data.binary_matrix.tn}</div>
                        <div className="text-[11px] font-sans text-emerald-400 mt-1 font-semibold">True Negative (TN)</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Binary Sensitivity & Specificity Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">Binary Accuracy</div>
                  <div className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
                    {(data.binary_matrix.accuracy * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">Sensitivity (Recall)</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                    {(data.binary_matrix.sensitivity * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400">Specificity</div>
                  <div className="text-lg font-bold text-sky-400 font-mono tabular-nums mt-0.5">
                    {(data.binary_matrix.specificity * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Column: Dynamic Threshold Tuning & Per-Class Breakdown */}
        <div className="lg:col-span-5 space-y-5">
          {/* Threshold Tuning Slider */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Congestion Threshold Tuning</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold tabular-nums">
                {threshold}% Occupancy
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Modulate the decision boundary for classifying high-demand peak events vs nominal charging flow.
            </p>
            <div className="pt-2">
              <input
                type="range"
                min="60"
                max="90"
                step="5"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>60% (High Recall)</span>
                <span>75% (Balanced)</span>
                <span>90% (High Precision)</span>
              </div>
            </div>
          </div>

          {/* Per-Class Precision / Recall / F1 Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Per-Tier Performance Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-2 px-2.5">Demand Tier</th>
                    <th className="py-2 px-2 text-right">Precision</th>
                    <th className="py-2 px-2 text-right">Recall</th>
                    <th className="py-2 px-2 text-right">F1</th>
                    <th className="py-2 px-2 text-right">Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                  {data?.class_metrics.map((cm) => (
                    <tr key={cm.className} className="hover:bg-slate-800/40">
                      <td className="py-2 px-2.5 text-slate-200 font-sans font-medium">
                        {cm.className}
                      </td>
                      <td className="py-2 px-2 text-right text-emerald-400">
                        {(cm.precision * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-right text-sky-400">
                        {(cm.recall * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-right text-white font-semibold">
                        {(cm.f1 * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-right text-slate-400">
                        {cm.support}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
