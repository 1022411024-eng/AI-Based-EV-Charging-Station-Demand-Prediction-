import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Activity,
  Layers,
  BarChart2,
  Database,
  RefreshCw,
  User as UserIcon,
  Plus,
  Upload,
  Radio,
  MapPin,
  ChevronRight,
  Shield,
  ShieldAlert,
  Target,
  DollarSign,
  Lock,
} from 'lucide-react';
import { Station, PredictionResponse, ScenarioConfig } from './types';
import { StationList } from './components/StationList';
import { StationDetail } from './components/StationDetail';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { AddStationModal } from './components/AddStationModal';
import { CsvIngestionModal } from './components/CsvIngestionModal';
import { ConfusionMatrixView } from './components/ConfusionMatrixView';
import { DatasetView } from './components/DatasetView';
import { GridHeadroomView } from './components/GridHeadroomView';
import { FleetTariffsView } from './components/FleetTariffsView';
import { SignInWithGoogle } from './components/SignInWithGoogle';
import {
  auth,
  signOut,
  onAuthStateChanged,
  User,
} from '../lib/firebaseClient';

const DEFAULT_SCENARIO: ScenarioConfig = {
  id: 'baseline',
  name: 'Nominal Baseline',
  description: 'Standard daily commuter traffic and seasonal grid capacity',
  occupancy_multiplier: 1.0,
  grid_curtailment_pct: 0,
  tariff_multiplier: 1.0,
};

export default function App() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [loadingStations, setLoadingStations] = useState(true);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [scenario, setScenario] = useState<ScenarioConfig>(DEFAULT_SCENARIO);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Active view section: 'forecasting' | 'grid' | 'fleet' | 'evaluation' | 'dataset'
  const [activeNav, setActiveNav] = useState<'forecasting' | 'grid' | 'fleet' | 'evaluation' | 'dataset'>('forecasting');

  // Real Firebase Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [simulatedUser, setSimulatedUser] = useState<{
    displayName: string;
    email: string;
    photoURL?: string;
  } | null>(null);

  const effectiveUser = currentUser || simulatedUser;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setSimulatedUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase sign-out notice:', err);
    }
    setCurrentUser(null);
    setSimulatedUser(null);
    setAuthError(null);
    if (activeNav === 'evaluation' || activeNav === 'dataset') {
      setActiveNav('forecasting');
    }
  };

  // Fetch stations on mount
  const fetchStations = async () => {
    try {
      setLoadingStations(true);
      const res = await fetch('/api/stations');
      const data = await res.json();
      if (data.stations) {
        setStations(data.stations);
        if (!selectedStation && data.stations.length > 0) {
          setSelectedStation(data.stations[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoadingStations(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // Fetch prediction when selected station or scenario changes
  const fetchPrediction = useCallback(
    async (station: Station, currentScenario: ScenarioConfig) => {
      try {
        setLoadingPrediction(true);
        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            station_id: station.id,
            scenario: {
              occupancy_multiplier: currentScenario.occupancy_multiplier,
              grid_curtailment_pct: currentScenario.grid_curtailment_pct,
              tariff_multiplier: currentScenario.tariff_multiplier,
              weather_override: currentScenario.weather_override,
              temp_delta: currentScenario.temp_delta,
            },
          }),
        });
        const data = await res.json();
        if (data.success) {
          setPredictionData(data);
        }
      } catch (err) {
        console.error('Prediction request error:', err);
      } finally {
        setLoadingPrediction(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedStation) {
      fetchPrediction(selectedStation, scenario);
    }
  }, [selectedStation, scenario, fetchPrediction]);

  const handleSelectStation = (station: Station) => {
    setSelectedStation(station);
    if (activeNav !== 'forecasting') {
      setActiveNav('forecasting');
    }
  };

  const handleStationAdded = (newStation: Station) => {
    setStations((prev) => [newStation, ...prev]);
    setSelectedStation(newStation);
  };

  const handleStationsIngested = (newStations: Station[]) => {
    setStations((prev) => [...newStations, ...prev]);
    if (newStations.length > 0) {
      setSelectedStation(newStations[0]);
    }
  };

  const handleResetDefaults = async () => {
    try {
      setLoadingStations(true);
      const res = await fetch('/api/stations/reset-defaults', { method: 'POST' });
      const data = await res.json();
      if (data.stations) {
        setStations(data.stations);
        setSelectedStation(data.stations[0] || null);
        setScenario(DEFAULT_SCENARIO);
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setLoadingStations(false);
    }
  };

  const renderGatedView = (viewName: 'Confusion Matrix & Accuracy' | 'Dataset') => (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500" />
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Lock size={26} />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">
          {viewName} Requires Sign-In
        </h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {viewName === 'Confusion Matrix & Accuracy'
            ? 'Access to the confusion matrix, multi-class error distribution, and ML validation benchmarks is restricted to authenticated operators.'
            : 'Access to the ground truth telemetry, feature correlations, and CSV benchmark dataset is restricted to authenticated operators.'}
        </p>

        <div className="flex flex-col items-center gap-3">
          <SignInWithGoogle
            className="w-full justify-center py-2.5 text-sm"
            onSuccess={() => setAuthError(null)}
            onError={(err) => {
              setAuthError(err?.message || 'Firebase Google Sign-In failed');
            }}
          />

          {authError && (
            <div className="mt-2 text-left bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 w-full">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                <ShieldAlert size={14} />
                <span>Firebase Auth Notice</span>
              </div>
              <p className="text-[11px] text-rose-200 mt-1 leading-snug">{authError}</p>
              <button
                type="button"
                onClick={() => {
                  setSimulatedUser({
                    displayName: 'Elena Rostova',
                    email: 'elena.rostova@urbanev-grid.internal',
                    photoURL: '/src/assets/images/avatar_engineer_user_1791890624548.jpg',
                  });
                  setAuthError(null);
                }}
                className="mt-2.5 text-xs text-amber-300 hover:text-amber-200 underline font-medium cursor-pointer"
              >
                Continue in Dev Mode (Simulate Operator Login)
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Shield size={12} className="text-emerald-400" />
          <span>Protected by Firebase Client Authentication</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 
        TOP BAR CONTRACT:
        Zone 1: Brand Wordmark (one line)
        Zone 2: Navigation Links (single line, whitespace-nowrap)
        Zone 3: 1 Primary Action / Profile
      */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between gap-6 shrink-0 z-30 sticky top-0">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap size={18} />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            UrbanEV <span className="text-emerald-400 font-semibold">Demand Intelligence</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-400">
          <button
            onClick={() => setActiveNav('forecasting')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1.5 cursor-pointer ${
              activeNav === 'forecasting' ? 'text-white font-semibold' : ''
            }`}
          >
            <Activity size={13} className={activeNav === 'forecasting' ? 'text-emerald-400' : ''} />
            <span>Station Forecasting</span>
          </button>
          <button
            onClick={() => setActiveNav('grid')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1.5 cursor-pointer ${
              activeNav === 'grid' ? 'text-white font-semibold' : ''
            }`}
          >
            <Zap size={13} className={activeNav === 'grid' ? 'text-amber-400' : ''} />
            <span>Grid Headroom</span>
          </button>
          <button
            onClick={() => setActiveNav('fleet')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1.5 cursor-pointer ${
              activeNav === 'fleet' ? 'text-white font-semibold' : ''
            }`}
          >
            <DollarSign size={13} className={activeNav === 'fleet' ? 'text-emerald-400' : ''} />
            <span>Fleet Tariffs</span>
          </button>
          <button
            onClick={() => setActiveNav('evaluation')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1.5 cursor-pointer ${
              activeNav === 'evaluation' ? 'text-white font-semibold' : ''
            }`}
          >
            <Target size={13} className={activeNav === 'evaluation' ? 'text-emerald-400' : ''} />
            <span>Confusion Matrix & Accuracy</span>
            {!effectiveUser && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400/90 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.2 rounded font-mono">
                <Lock size={9} />
                <span>Auth</span>
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveNav('dataset')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white flex items-center gap-1.5 cursor-pointer ${
              activeNav === 'dataset' ? 'text-white font-semibold' : ''
            }`}
          >
            <Database size={13} className={activeNav === 'dataset' ? 'text-emerald-400' : ''} />
            <span>Dataset</span>
            {!effectiveUser && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400/90 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.2 rounded font-mono">
                <Lock size={9} />
                <span>Auth</span>
              </span>
            )}
          </button>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Upload size={12} />
            <span>CSV Ingestion</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action / Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleResetDefaults}
            title="Reset to default metropolitan hubs"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Reset stations to defaults"
          >
            <RefreshCw size={14} />
          </button>

          {effectiveUser ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                {effectiveUser.photoURL ? (
                  <img
                    src={effectiveUser.photoURL}
                    alt={effectiveUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-[10px] font-bold text-emerald-400">
                    {(effectiveUser.displayName || effectiveUser.email || 'O')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="hidden sm:block text-left max-w-[120px]">
                <div className="text-xs font-medium text-slate-200 leading-none truncate">
                  {effectiveUser.displayName || 'Operator'}
                </div>
                <div className="text-[10px] text-slate-400 leading-none mt-0.5 truncate">
                  {effectiveUser.email || 'Authenticated'}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-[11px] text-slate-400 hover:text-rose-300 ml-1 hover:underline cursor-pointer"
                title="Sign out of Firebase"
              >
                Sign out
              </button>
            </div>
          ) : (
            <SignInWithGoogle
              onSuccess={() => setAuthError(null)}
              onError={(err) => setAuthError(err?.message || 'Sign in error')}
            />
          )}
        </div>
      </header>

      {/* Main Workspace based on activeNav */}
      {activeNav === 'grid' ? (
        <GridHeadroomView stations={stations} onSelectStation={handleSelectStation} />
      ) : activeNav === 'fleet' ? (
        <FleetTariffsView stations={stations} onSelectStation={handleSelectStation} />
      ) : activeNav === 'evaluation' ? (
        effectiveUser ? (
          <ConfusionMatrixView stations={stations} />
        ) : (
          renderGatedView('Confusion Matrix & Accuracy')
        )
      ) : activeNav === 'dataset' ? (
        effectiveUser ? (
          <DatasetView stations={stations} />
        ) : (
          renderGatedView('Dataset')
        )
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Sidebar: Station Roster */}
          <StationList
            stations={stations}
            selectedStation={selectedStation}
            onSelectStation={handleSelectStation}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenCsvModal={() => setIsCsvModalOpen(true)}
          />

          {/* Right Main Content */}
          <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
            {/* Scenario Simulation Toolbar Bar */}
            <div className="p-6 pb-0">
              <ScenarioSimulator
                currentScenario={scenario}
                onScenarioChange={setScenario}
                onTriggerRecalculate={() => {
                  if (selectedStation) fetchPrediction(selectedStation, scenario);
                }}
                loading={loadingPrediction}
              />
            </div>

            {/* Station Prediction Dashboard */}
            {selectedStation ? (
              <StationDetail
                station={selectedStation}
                predictionData={predictionData}
                loading={loadingPrediction}
                currentScenario={scenario}
                onRefreshPrediction={() => fetchPrediction(selectedStation, scenario)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
                <MapPin size={40} className="mb-3 text-slate-600" />
                <p className="text-sm font-medium text-slate-400">
                  Select an EV charging hub from the sidebar to inspect demand forecasts.
                </p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Modals */}
      <AddStationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onStationAdded={handleStationAdded}
      />

      <CsvIngestionModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onStationsIngested={handleStationsIngested}
      />
    </div>
  );
}
