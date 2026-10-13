import React, { useState } from 'react';
import { Sliders, Sun, CloudRain, Zap, ShieldAlert, DollarSign, RotateCcw } from 'lucide-react';
import { ScenarioConfig } from '../types';

interface ScenarioSimulatorProps {
  currentScenario: ScenarioConfig;
  onScenarioChange: (scenario: ScenarioConfig) => void;
  onTriggerRecalculate: () => void;
  loading: boolean;
}

const PRESET_SCENARIOS: ScenarioConfig[] = [
  {
    id: 'baseline',
    name: 'Nominal Baseline',
    description: 'Standard daily commuter traffic and seasonal grid capacity',
    occupancy_multiplier: 1.0,
    grid_curtailment_pct: 0,
    tariff_multiplier: 1.0,
  },
  {
    id: 'heatwave',
    name: 'Extreme Heatwave',
    description: '+10°C thermal stress, active HVAC draw and battery cooling',
    weather_override: 'Extreme Heat',
    temp_delta: 10,
    occupancy_multiplier: 1.22,
    grid_curtailment_pct: 15,
    tariff_multiplier: 1.35,
  },
  {
    id: 'commuter_surge',
    name: 'Metropolitan Fleet Surge',
    description: '+35% concurrent ride-hail & corporate EV commute surge',
    occupancy_multiplier: 1.35,
    grid_curtailment_pct: 0,
    tariff_multiplier: 1.15,
  },
  {
    id: 'rainstorm',
    name: 'Severe Rainstorm',
    description: 'Reduced speeds, extended depot dwell times (+15%)',
    weather_override: 'Rainy',
    occupancy_multiplier: 1.15,
    grid_curtailment_pct: 5,
    tariff_multiplier: 1.0,
  },
  {
    id: 'curtailment',
    name: 'Substation Brownout Curtailment',
    description: 'Upstream utility curtailment capping power headroom by 40%',
    occupancy_multiplier: 0.95,
    grid_curtailment_pct: 40,
    tariff_multiplier: 1.5,
  },
];

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  currentScenario,
  onScenarioChange,
  onTriggerRecalculate,
  loading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePresetSelect = (preset: ScenarioConfig) => {
    onScenarioChange(preset);
  };

  const handleCustomParamChange = (field: keyof ScenarioConfig, val: any) => {
    onScenarioChange({
      ...currentScenario,
      id: 'custom',
      name: 'Custom Stress Scenario',
      description: 'Operator-customized stress testing parameters',
      [field]: val,
    });
  };

  const isCustom = currentScenario.id === 'custom';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Grid Stress & Demand Scenario Simulator</h3>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs font-mono text-emerald-400">
            {currentScenario.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-md hover:bg-slate-800 transition"
          >
            {isExpanded ? 'Hide Parameters' : 'Adjust Sliders'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onTriggerRecalculate}
            className="px-3 py-1.5 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <Zap size={13} />
            {loading ? 'Re-evaluating...' : 'Simulate Model'}
          </button>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
        {PRESET_SCENARIOS.map((preset) => {
          const isActive = currentScenario.id === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset)}
              className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                isActive
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white truncate">{preset.name}</span>
                {preset.id === 'heatwave' && <Sun size={12} className="text-amber-400" />}
                {preset.id === 'rainstorm' && <CloudRain size={12} className="text-sky-400" />}
                {preset.id === 'curtailment' && <ShieldAlert size={12} className="text-rose-400" />}
                {preset.id === 'commuter_surge' && <Zap size={12} className="text-emerald-400" />}
                {preset.id === 'baseline' && <RotateCcw size={12} className="text-slate-400" />}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Interactive Controls Drawer */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Traffic / Demand Multiplier</span>
              <span className="font-mono text-emerald-400 tabular-nums">
                {Math.round(currentScenario.occupancy_multiplier * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={currentScenario.occupancy_multiplier}
              onChange={(e) => handleCustomParamChange('occupancy_multiplier', parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">Scale concurrent driver arrival volume</span>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Substation Curtailment Limit</span>
              <span className="font-mono text-rose-400 tabular-nums">
                -{currentScenario.grid_curtailment_pct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={currentScenario.grid_curtailment_pct}
              onChange={(e) => handleCustomParamChange('grid_curtailment_pct', parseInt(e.target.value, 10))}
              className="w-full accent-rose-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">Throttle max substation interconnection headroom</span>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Tariff Dynamic Pricing Rate</span>
              <span className="font-mono text-amber-400 tabular-nums">
                {currentScenario.tariff_multiplier.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="2.5"
              step="0.1"
              value={currentScenario.tariff_multiplier}
              onChange={(e) => handleCustomParamChange('tariff_multiplier', parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">Simulate congestion surcharge elasticity</span>
          </div>
        </div>
      )}
    </div>
  );
};
