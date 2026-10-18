/**
 * Camada de dados: fala com a API REST do InjuryDetector.
 * Todos os métodos são assíncronos. O athleteId vem do contexto de auth.
 */

import { apiRequest } from './apiClient';
import type {
  AthleteProfileApi,
  DailyRecord,
  TrainingRecord,
  DashboardData,
  ExplainData,
  ListParams,
  PagedResult,
} from '../types';

/** Monta a query string a partir dos ListParams (ignora vazios). */
function buildQuery(params: ListParams = {}): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params.sortBy) sp.set('sortBy', params.sortBy);
  if (params.sortDir) sp.set('sortDir', params.sortDir);
  if (params.from) sp.set('from', params.from);
  if (params.to) sp.set('to', params.to);
  if (params.workout_type) sp.set('workout_type', params.workout_type);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ----------------- Perfil -----------------
export async function getAthleteProfile(
  athleteId: string
): Promise<AthleteProfileApi> {
  return apiRequest<AthleteProfileApi>(`/athletes/${athleteId}`);
}

export async function updateAthleteProfile(
  athleteId: string,
  profile: Partial<AthleteProfileApi>
): Promise<void> {
  await apiRequest(`/athletes/${athleteId}`, { method: 'PUT', body: profile });
}

// ----------------- Daily -----------------
interface DailyApi {
  record_date: string;
  resting_hr: number;
  hrv: number;
  sleep_hours: number;
  sleep_quality: number;
  deep_sleep: number;
  light_sleep: number;
  rem_sleep: number;
  body_battery_morning: number;
  stress: number;
  body_battery_evening: number;
  actual_tss: number | null;
}

function dailyFromApi(r: DailyApi): DailyRecord {
  return {
    id: r.record_date,
    date: (r.record_date || '').slice(0, 10),
    resting_hr: r.resting_hr,
    hrv: r.hrv,
    sleep_hours: r.sleep_hours,
    sleep_quality: r.sleep_quality,
    deep_sleep: r.deep_sleep,
    light_sleep: r.light_sleep,
    rem_sleep: r.rem_sleep,
    body_battery_morning: r.body_battery_morning,
    body_battery_evening: r.body_battery_evening,
    stress: r.stress,
    actual_tss: r.actual_tss,
  };
}

interface DailyPagedApi {
  items: DailyApi[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export async function getDailyRecords(
  athleteId: string,
  params: ListParams = {}
): Promise<PagedResult<DailyRecord>> {
  const res = await apiRequest<DailyPagedApi>(
    `/athletes/${athleteId}/daily${buildQuery(params)}`
  );
  return { ...res, items: res.items.map(dailyFromApi) };
}

/** Último registro diário (para a Home). */
export async function getLatestDaily(
  athleteId: string
): Promise<DailyRecord | null> {
  const res = await getDailyRecords(athleteId, {
    page: 1,
    pageSize: 1,
    sortBy: 'record_date',
    sortDir: 'desc',
  });
  return res.items[0] ?? null;
}

export async function saveDailyRecord(
  athleteId: string,
  record: Omit<DailyRecord, 'id'>
): Promise<void> {
  await apiRequest(`/athletes/${athleteId}/daily`, {
    method: 'POST',
    body: {
      record_date: record.date,
      resting_hr: record.resting_hr,
      hrv: record.hrv,
      sleep_hours: record.sleep_hours,
      sleep_quality: record.sleep_quality,
      deep_sleep: record.deep_sleep,
      light_sleep: record.light_sleep,
      rem_sleep: record.rem_sleep,
      body_battery_morning: record.body_battery_morning,
      stress: record.stress,
      body_battery_evening: record.body_battery_evening,
      actual_tss: record.actual_tss ?? null,
    },
  });
}

// ----------------- Training -----------------
interface TrainingApi {
  activity_id: string;
  activity_date: string;
  workout_type: string;
  duration_minutes: number;
  distance_km: number;
  elevation_gain: number;
  avg_hr: number;
  max_hr: number;
  avg_speed_kph: number;
  avg_pace_min_km: number;
  tss: number;
  intensity_factor: number;
  training_effect_aerobic: number;
  training_effect_anaerobic: number;
}

function trainingFromApi(r: TrainingApi): TrainingRecord {
  return {
    id: r.activity_id,
    date: (r.activity_date || '').slice(0, 10),
    workout_type: r.workout_type as TrainingRecord['workout_type'],
    duration_minutes: r.duration_minutes,
    distance_km: r.distance_km,
    elevation_gain: r.elevation_gain,
    avg_hr: r.avg_hr,
    max_hr: r.max_hr,
    avg_speed_kph: r.avg_speed_kph,
    avg_pace_min_km: r.avg_pace_min_km,
    tss: r.tss,
    intensity_factor: r.intensity_factor,
    training_effect_aerobic: r.training_effect_aerobic,
    training_effect_anaerobic: r.training_effect_anaerobic,
  };
}

interface TrainingPagedApi {
  items: TrainingApi[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export async function getTrainingRecords(
  athleteId: string,
  params: ListParams = {}
): Promise<PagedResult<TrainingRecord>> {
  const res = await apiRequest<TrainingPagedApi>(
    `/athletes/${athleteId}/trainings${buildQuery(params)}`
  );
  return { ...res, items: res.items.map(trainingFromApi) };
}

/** Último treino (para a Home). */
export async function getLatestTraining(
  athleteId: string
): Promise<TrainingRecord | null> {
  const res = await getTrainingRecords(athleteId, {
    page: 1,
    pageSize: 1,
    sortBy: 'activity_date',
    sortDir: 'desc',
  });
  return res.items[0] ?? null;
}

export async function saveTrainingRecord(
  athleteId: string,
  record: Omit<TrainingRecord, 'id'> & { id?: string }
): Promise<void> {
  await apiRequest(`/athletes/${athleteId}/trainings`, {
    method: 'POST',
    body: {
      activity_id: record.id,
      activity_date: record.date,
      workout_type: record.workout_type,
      duration_minutes: record.duration_minutes,
      distance_km: record.distance_km,
      elevation_gain: record.elevation_gain,
      avg_hr: record.avg_hr,
      max_hr: record.max_hr,
      avg_speed_kph: record.avg_speed_kph,
      avg_pace_min_km: record.avg_pace_min_km,
      tss: record.tss,
      intensity_factor: record.intensity_factor,
      training_effect_aerobic: record.training_effect_aerobic,
      training_effect_anaerobic: record.training_effect_anaerobic,
    },
  });
}

// ----------------- Dashboard -----------------
export async function getDashboard(
  athleteId: string,
  days = 90
): Promise<DashboardData> {
  return apiRequest<DashboardData>(
    `/athletes/${athleteId}/dashboard?days=${days}`
  );
}

// ----------------- Explicabilidade -----------------
export async function getExplain(
  athleteId: string,
  opts: { days?: number; features?: string[]; date?: string } = {}
): Promise<ExplainData> {
  const sp = new URLSearchParams();
  if (opts.days) sp.set('days', String(opts.days));
  if (opts.features?.length) sp.set('features', opts.features.join(','));
  if (opts.date) sp.set('date', opts.date);
  const qs = sp.toString();
  return apiRequest<ExplainData>(
    `/athletes/${athleteId}/explain${qs ? `?${qs}` : ''}`
  );
}
