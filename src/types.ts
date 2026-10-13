export interface Station {
  id: string;
  name: string;
  city: string;
  address: string;
  base_occupancy: number; // percentage (0-100)
  base_power: number; // kW per active port
  charger_count: number;
  dc_fast_count: number;
  ac_level2_count: number;
  max_grid_capacity_kw: number;
  temperature: number;
  is_raining: boolean;
  weather_condition: 'Clear' | 'Rainy' | 'Overcast' | 'Snow' | 'Extreme Heat';
  peak_tariff_per_kwh: number;
  off_peak_tariff_per_kwh: number;
  created_at: string;
}

export interface HourlyPrediction {
  time: string;
  hour: number;
  occupancy: number;
  power_kw: number;
  active_ports: number;
  grid_stress_pct: number;
  estimated_cost_per_kwh: number;
}

export interface DailyPrediction {
  date: string;
  day_name: string;
  avg_occupancy: number;
  peak_occupancy: number;
  total_energy_kwh: number;
  estimated_revenue: number;
}

export interface PredictionMetrics {
  peakOccupancy: number;
  peakPowerKw: number;
  avgOccupancy: number;
  totalDailyKwh: number;
  carbonOffsetKg: number;
  estimatedRevenue: number;
  effectiveGridCapacity: number;
}

export interface AIAnalysis {
  summary: string;
  grid_advisory: string;
  dispatch_recommendation: string;
  weather_impact: string;
}

export interface PredictionResponse {
  success: boolean;
  station_id: string;
  station_name: string;
  city: string;
  weather: {
    condition: string;
    temperature: number;
    is_raining: boolean;
  };
  metrics: PredictionMetrics;
  ai_analysis: AIAnalysis;
  predictions: HourlyPrediction[];
  historical: HourlyPrediction[];
  weekly_predictions: DailyPrediction[];
}

export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  weather_override?: 'Clear' | 'Rainy' | 'Overcast' | 'Snow' | 'Extreme Heat';
  temp_delta?: number;
  occupancy_multiplier: number;
  grid_curtailment_pct: number;
  tariff_multiplier: number;
}

export interface ClassMetric {
  className: string;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface ConfusionMatrixData {
  labels: string[];
  // matrix[actualIndex][predictedIndex]
  matrix: number[][];
  total_samples: number;
  accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  mae_occupancy: number;
  rmse_occupancy: number;
  r2_score: number;
  binary_matrix: {
    labels: ['Peak Congestion (≥75%)', 'Normal (<75%)'];
    tp: number;
    fp: number;
    fn: number;
    tn: number;
    accuracy: number;
    sensitivity: number;
    specificity: number;
  };
  class_metrics: ClassMetric[];
}

export interface DatasetRecord {
  id: string;
  timestamp: string;
  station_id: string;
  station_name: string;
  city: string;
  hour: number;
  day_of_week: string;
  temperature: number;
  is_raining: boolean;
  actual_occupancy: number;
  predicted_occupancy: number;
  actual_power_kw: number;
  predicted_power_kw: number;
  actual_tier: 'High' | 'Moderate' | 'Low';
  predicted_tier: 'High' | 'Moderate' | 'Low';
  split: 'train' | 'val' | 'test';
}

export interface FeatureMeta {
  name: string;
  type: string;
  importance: number;
  correlation: number;
  description: string;
}

export interface DatasetSummary {
  total_records: number;
  train_count: number;
  val_count: number;
  test_count: number;
  time_span: string;
  stations_covered: number;
  features: FeatureMeta[];
}
