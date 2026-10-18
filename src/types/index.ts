export type LifestyleOption =
  | 'Competidor Equilibrado'
  | 'Atleta Consciente da Saúde'
  | 'Atleta Altamente Disciplinado'
  | 'Workaholic com Privação de Sono'
  | 'Atleta Sub-Recuperado'
  | 'Socializador de Fim de Semana';

export type WorkoutType =
  | 'Corrida de Resistência'
  | 'Longão'
  | 'Corrida de Recuperação'
  | 'Intervalos de Limiar'
  | 'Treino Extra Não Planejado (Resistência)'
  | 'Treino Extra Não Planejado (Intervalos)'
  | 'Treino Extra Não Planejado (Tempo)'
  | 'Treino Extra Não Planejado (Limiar)';

export type ToastType = 'success' | 'error';

/**
 * Perfil do atleta no FRONT.
 * - birthDate é usado só na UI; convertido para `age` antes de enviar à API.
 * - Baselines fisiológicos (hrv_baseline, vo2max, etc.) ficam fora do cadastro;
 *   são preenchidos depois pela função diária de atualização (Etapa 6).
 */
export interface AthleteProfile {
  id: string;
  name: string;
  photo: string | null;
  gender: 'Masculino' | 'Feminino';
  birthDate: {
    day: number;
    month: number;
    year: number;
  };
  height_cm: number;
  weight_kg: number;
  training_experience: number;
  lifestyle: LifestyleOption;
  drinking_factor: number;
  nutrition_factor: number;
  email: string;
}

/** Perfil como vem/vai da API (age em vez de birthDate; sem senha). */
export interface AthleteProfileApi {
  athlete_id: string;
  name: string | null;
  gender: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  training_experience: number;
  lifestyle: string;
  drinking_factor: number | null;
  nutrition_factor: number | null;
  email: string;
  // Baselines (podem vir null até a função diária preencher)
  stress_factor?: number | null;
  hrv_baseline?: number | null;
  max_hr?: number | null;
  resting_hr?: number | null;
  lthr?: number | null;
  vo2max?: number | null;
  running_threshold_pace?: number | null;
  weekly_training_hours?: number | null;
  recovery_rate?: number | null;
  sleep_time_norm?: number | null;
  sleep_quality?: number | null;
}

/**
 * Registro diário. Valores numéricos (as frases de prontidão/estresse são
 * convertidas no front antes de salvar). planned_tss foi removido; actual_tss
 * é calculado e pode ser exibido.
 */
export interface DailyRecord {
  id: string;
  date: string; // record_date (YYYY-MM-DD)
  resting_hr: number;
  hrv: number;
  sleep_hours: number;
  sleep_quality: number;
  deep_sleep: number;
  light_sleep: number;
  rem_sleep: number;
  body_battery_morning: number; // UI: "Prontidão (manhã)"
  body_battery_evening: number; // UI: "Prontidão (noite)"
  stress: number; // UI: frases de estresse
  actual_tss?: number | null;
}

export interface TrainingRecord {
  id: string;
  date: string; // activity_date
  workout_type: WorkoutType;
  duration_minutes: number;
  distance_km: number;
  elevation_gain: number;
  avg_hr: number;
  max_hr: number;
  avg_speed_kph: number;
  avg_pace_min_km: number; // minutos por km (número)
  tss: number;
  intensity_factor: number;
  training_effect_aerobic: number;
  training_effect_anaerobic: number;
}

/** Saída do modelo V4 para o dashboard. */
export interface InjuryPrediction {
  prediction_date: string;
  risk_probability: number;
  risk_flag: number;
  threshold_used: number;
  model_version: string;
  explanation: unknown | null;
}

export interface RiskSeriesPoint {
  prediction_date: string;
  risk_probability: number;
  risk_flag: number;
}

export interface LoadSeriesPoint {
  activity_date: string;
  tss_total: number;
}

export interface DashboardData {
  athlete_id: string;
  latest: InjuryPrediction | null;
  risk_series: RiskSeriesPoint[];
  load_series: LoadSeriesPoint[];
}

/** Explicabilidade (SHAP) */
export interface FeatureRanking {
  feature: string;
  label: string;
  mean_abs_shap: number;
}

export interface ExplainSeriesPoint {
  date: string;
  risk: number;
  features: Record<string, number>;
}

export interface ShapContribution {
  feature: string;
  label: string;
  contribution: number;
}

export interface ExplainDay {
  date: string;
  risk: number;
  shap: ShapContribution[];
}

export interface ExplainData {
  ranking: FeatureRanking[];
  series: ExplainSeriesPoint[];
  day: ExplainDay | null;
}

/** Direção de ordenação. */
export type SortDir = 'asc' | 'desc';

/** Parâmetros de listagem paginada/ordenada. */
export interface ListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: SortDir;
  from?: string;
  to?: string;
  workout_type?: string;
}

/** Resposta paginada genérica. */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortDir: SortDir;
}

export interface InjuryRiskStatus {
  hasRisk: boolean;
  title: string;
  message: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  athleteId: string | null;
  athleteName: string | null;
  athletePhoto: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}
