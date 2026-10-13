import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { DatasetRecord, DatasetSummary, Station } from '../types';

interface DatasetViewProps {
  stations: Station[];
}

export const DatasetView: React.FC<DatasetViewProps> = ({ stations }) => {
  const [records, setRecords] = useState<DatasetRecord[]>([]);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSplit, setSelectedSplit] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchDataset = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        split: selectedSplit,
        tier: selectedTier,
        city: selectedCity,
        page: String(currentPage),
        pageSize: String(pageSize),
      });

      const res = await fetch(`/api/dataset?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
        setSummary(data.summary);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to load dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, [searchTerm, selectedSplit, selectedTier, selectedCity, currentPage]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  const handleDownloadCsv = () => {
    window.location.href = '/api/dataset/download';
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Section Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database size={20} className="text-emerald-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">UrbanEV Benchmark Dataset</h2>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs font-mono text-emerald-400">Telemetry & Validation Repository</span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Multi-station historical charging data, sensory ground truth, and train/val/test splits used for model training and benchmark verification.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="px-3.5 py-2 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition flex items-center gap-1.5 shrink-0 self-start md:self-auto"
        >
          <Download size={14} />
          <span>Export Full Dataset (.CSV)</span>
        </button>
      </div>

      {/* Dataset Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Total Records</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {summary ? summary.total_records.toLocaleString() : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Hourly intervals</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Training Split</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {summary ? `${summary.train_count.toLocaleString()}` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">70% sample ratio</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Validation Split</div>
          <div className="text-2xl font-bold text-sky-400 font-mono tabular-nums">
            {summary ? `${summary.val_count.toLocaleString()}` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">15% tuning split</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Test Benchmark Split</div>
          <div className="text-2xl font-bold text-purple-400 font-mono tabular-nums">
            {summary ? `${summary.test_count.toLocaleString()}` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">15% holdout test</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 mb-1">Temporal Span</div>
          <div className="text-sm font-semibold text-white mt-1">14 Continuous Days</div>
          <div className="text-[10px] text-slate-400 mt-1">6 Metro hubs</div>
        </div>
      </div>

      {/* Feature Metadata & Correlation Matrix */}
      {summary?.features && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Feature Schema & Relative Importance</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              6 Explanatory Predictors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {summary.features.map((feat) => (
              <div key={feat.name} className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-emerald-300">{feat.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{feat.type}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full"
                      style={{ width: `${Math.round(feat.importance * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-300 tabular-nums">
                    {Math.round(feat.importance * 100)}% imp
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Data Table Browser */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">Dataset Records Explorer</h3>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              ({total.toLocaleString()} matching records)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-slate-500" size={13} />
              <input
                type="text"
                placeholder="Search station or city..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44"
              />
            </div>

            {/* Split Filter */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
              {['all', 'train', 'val', 'test'].map((sp) => (
                <button
                  key={sp}
                  onClick={() => {
                    setSelectedSplit(sp);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 rounded capitalize transition ${
                    selectedSplit === sp ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>

            {/* Demand Tier Filter */}
            <select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Tiers</option>
              <option value="High">High (≥75%)</option>
              <option value="Moderate">Moderate (40-74%)</option>
              <option value="Low">Low (&lt;40%)</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Station & City</th>
                <th className="py-2.5 px-2">Hour</th>
                <th className="py-2.5 px-2">Day</th>
                <th className="py-2.5 px-2">Weather</th>
                <th className="py-2.5 px-3 text-right">Actual Occ.</th>
                <th className="py-2.5 px-3 text-right">Predicted Occ.</th>
                <th className="py-2.5 px-2 text-right">Residual Δ</th>
                <th className="py-2.5 px-3 text-right">Actual kW</th>
                <th className="py-2.5 px-2">Tier Match</th>
                <th className="py-2.5 px-3 text-right">Split</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-sans">
                    Loading dataset records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-sans">
                    No records match the active filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const errorDelta = r.predicted_occupancy - r.actual_occupancy;
                  const isMatch = r.actual_tier === r.predicted_tier;

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 text-slate-300">{r.timestamp}</td>
                      <td className="py-2 px-3 text-white font-sans truncate max-w-[160px]">
                        {r.station_name} <span className="text-slate-500 font-mono text-[11px]">({r.city})</span>
                      </td>
                      <td className="py-2 px-2 text-slate-300">{String(r.hour).padStart(2, '0')}:00</td>
                      <td className="py-2 px-2 text-slate-400">{r.day_of_week.substring(0, 3)}</td>
                      <td className="py-2 px-2 text-slate-300">{r.temperature}°C {r.is_raining ? '🌧️' : '☀️'}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-200">
                        {r.actual_occupancy}%
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                        {r.predicted_occupancy}%
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={Math.abs(errorDelta) > 5 ? 'text-amber-400' : 'text-slate-400'}>
                          {errorDelta > 0 ? `+${errorDelta}` : errorDelta}%
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">{r.actual_power_kw} kW</td>
                      <td className="py-2 px-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-sans ${
                            isMatch
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {r.actual_tier} → {r.predicted_tier}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`text-[10px] uppercase font-bold ${
                            r.split === 'test'
                              ? 'text-purple-400'
                              : r.split === 'val'
                              ? 'text-sky-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {r.split}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} of {total.toLocaleString()} records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
