import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Station } from '../types';

interface CsvIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStationsIngested: (stations: Station[]) => void;
}

const SAMPLE_CSV = `name,city,address,charger_count,dc_fast_count,base_occupancy,base_power,max_grid_capacity_kw,temperature,weather_condition,peak_tariff_per_kwh,off_peak_tariff_per_kwh
"Mission Bay Fleet Depot","San Francisco","550 16th St, San Francisco, CA",20,16,72,130,2400,18,"Clear",0.46,0.21
"Bellevue Mobility Hub","Seattle","11000 NE 4th St, Bellevue, WA",18,14,64,115,1900,14,"Rainy",0.39,0.18
"Domain Northside Supercharger","Austin","11801 Domain Blvd, Austin, TX",24,20,85,150,3000,33,"Extreme Heat",0.45,0.22
"North Loop Fleet Terminal","Chicago","300 N Michigan Ave, Chicago, IL",16,12,70,120,1800,16,"Overcast",0.42,0.20`;

export const CsvIngestionModal: React.FC<CsvIngestionModalProps> = ({
  isOpen,
  onClose,
  onStationsIngested,
}) => {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ev_stations_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleIngest = async () => {
    if (!csvText.trim()) {
      setError('Please provide CSV content to ingest.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stations/batch-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_content: csvText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to ingest CSV data');
      }

      setSuccessCount(data.count);
      onStationsIngested(data.stations);
      setTimeout(() => {
        onClose();
        setSuccessCount(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error parsing CSV records');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Batch CSV Station Ingestion</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bulk upload charging station telemetry and historical metadata
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>Successfully ingested {successCount} charging stations! Updating roster...</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition flex items-center gap-1.5">
                <FileText size={14} />
                <span>Upload CSV File</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 transition flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>Download Sample Template</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCsvText(SAMPLE_CSV)}
              className="text-xs text-emerald-400 hover:underline"
            >
              Reset to Sample Data
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              CSV Content (Header + Rows)
            </label>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
              placeholder="Paste comma-separated station metadata here..."
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 block mb-1">Supported CSV Columns:</span>
            <code className="text-emerald-400 font-mono text-[11px]">
              name, city, address, charger_count, dc_fast_count, base_occupancy, base_power, max_grid_capacity_kw, temperature, weather_condition, peak_tariff_per_kwh, off_peak_tariff_per_kwh
            </code>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !csvText.trim()}
              onClick={handleIngest}
              className="px-4 py-2 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition flex items-center gap-1.5"
            >
              <Upload size={14} />
              {loading ? 'Ingesting...' : 'Ingest & Append Records'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
