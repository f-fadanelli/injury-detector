import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import Footer from '../components/Footer';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { getTrainingRecords, saveTrainingRecord } from '../services/dataService';
import { validateNumericRange, validatePaceFormat } from '../utils/validators';
import { paceToDecimal, decimalToPace } from '../utils/scales';
import type { TrainingRecord, WorkoutType, SortDir } from '../types';
import './TrainingInfoScreen.css';

const WORKOUT_TYPE_OPTIONS: WorkoutType[] = [
  'Corrida de Resistência',
  'Longão',
  'Corrida de Recuperação',
  'Intervalos de Limiar',
  'Treino Extra Não Planejado (Resistência)',
  'Treino Extra Não Planejado (Intervalos)',
  'Treino Extra Não Planejado (Tempo)',
  'Treino Extra Não Planejado (Limiar)',
];

interface FormData {
  date: string;
  workout_type: WorkoutType;
  duration_minutes: string;
  distance_km: string;
  elevation_gain: string;
  avg_hr: string;
  max_hr: string;
  avg_speed_kph: string;
  avg_pace_min_km: string;
  tss: string;
  intensity_factor: string;
  training_effect_aerobic: string;
  training_effect_anaerobic: string;
}

interface FieldErrors {
  [key: string]: string;
}

function getEmptyFormData(): FormData {
  const today = new Date().toISOString().split('T')[0];
  return {
    date: today,
    workout_type: 'Corrida de Resistência',
    duration_minutes: '',
    distance_km: '',
    elevation_gain: '',
    avg_hr: '',
    max_hr: '',
    avg_speed_kph: '',
    avg_pace_min_km: '',
    tss: '',
    intensity_factor: '',
    training_effect_aerobic: '',
    training_effect_anaerobic: '',
  };
}

function recordToFormData(record: TrainingRecord): FormData {
  return {
    date: record.date,
    workout_type: record.workout_type,
    duration_minutes: String(record.duration_minutes),
    distance_km: String(record.distance_km),
    elevation_gain: String(record.elevation_gain),
    avg_hr: String(record.avg_hr),
    max_hr: String(record.max_hr),
    avg_speed_kph: String(record.avg_speed_kph),
    avg_pace_min_km: decimalToPace(record.avg_pace_min_km),
    tss: String(record.tss),
    intensity_factor: String(record.intensity_factor),
    training_effect_aerobic: String(record.training_effect_aerobic),
    training_effect_anaerobic: String(record.training_effect_anaerobic),
  };
}

export default function TrainingInfoScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { athleteId } = useAuth();
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(getEmptyFormData());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Paginação / ordenação (server-side)
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>('activity_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterWorkoutType, setFilterWorkoutType] = useState('');

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId, page, pageSize, sortBy, sortDir, filterDateFrom, filterDateTo, filterWorkoutType]);

  async function loadRecords() {
    if (!athleteId) return;
    setLoading(true);
    try {
      const res = await getTrainingRecords(athleteId, {
        page,
        pageSize,
        sortBy,
        sortDir,
        from: filterDateFrom || undefined,
        to: filterDateTo || undefined,
        workout_type: filterWorkoutType || undefined,
      });
      setRecords(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      showToast('Erro ao carregar treinos.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  function sortIndicator(field: string) {
    if (sortBy !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  }

  function handleAdd() {
    setEditingId(null);
    setFormData(getEmptyFormData());
    setFieldErrors({});
    setShowForm(true);
  }

  function handleEdit(record: TrainingRecord) {
    setEditingId(record.id);
    setFormData(recordToFormData(record));
    setFieldErrors({});
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData(getEmptyFormData());
    setFieldErrors({});
  }

  function handleFieldChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user changes it
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validateForm(): boolean {
    const errors: FieldErrors = {};

    if (!formData.date) {
      errors.date = 'Data é obrigatória';
    }

    const durationVal = parseFloat(formData.duration_minutes);
    if (isNaN(durationVal) || !validateNumericRange(durationVal, 1, 1440)) {
      errors.duration_minutes = 'Duração deve ser entre 1 e 1440 minutos';
    }

    const distanceVal = parseFloat(formData.distance_km);
    if (isNaN(distanceVal) || !validateNumericRange(distanceVal, 0.01, 500)) {
      errors.distance_km = 'Distância deve ser entre 0.01 e 500 km';
    }

    const elevationVal = parseFloat(formData.elevation_gain);
    if (isNaN(elevationVal) || !validateNumericRange(elevationVal, 0, 10000)) {
      errors.elevation_gain = 'Elevação deve ser entre 0 e 10000 m';
    }

    const avgHrVal = parseFloat(formData.avg_hr);
    if (isNaN(avgHrVal) || !validateNumericRange(avgHrVal, 30, 250)) {
      errors.avg_hr = 'FC média deve ser entre 30 e 250 bpm';
    }

    const maxHrVal = parseFloat(formData.max_hr);
    if (isNaN(maxHrVal) || !validateNumericRange(maxHrVal, 30, 250)) {
      errors.max_hr = 'FC máxima deve ser entre 30 e 250 bpm';
    }

    const avgSpeedVal = parseFloat(formData.avg_speed_kph);
    if (isNaN(avgSpeedVal) || !validateNumericRange(avgSpeedVal, 0.1, 50)) {
      errors.avg_speed_kph = 'Velocidade média deve ser entre 0.1 e 50 km/h';
    }

    if (!validatePaceFormat(formData.avg_pace_min_km)) {
      errors.avg_pace_min_km = 'Pace deve estar no formato mm:ss';
    }

    const tssVal = parseFloat(formData.tss);
    if (isNaN(tssVal) || !validateNumericRange(tssVal, 0, 1000)) {
      errors.tss = 'TSS deve ser entre 0 e 1000';
    }

    const ifVal = parseFloat(formData.intensity_factor);
    if (isNaN(ifVal) || !validateNumericRange(ifVal, 0, 10)) {
      errors.intensity_factor = 'Fator de intensidade deve ser entre 0 e 10';
    }

    const teAerobicVal = parseFloat(formData.training_effect_aerobic);
    if (isNaN(teAerobicVal) || !validateNumericRange(teAerobicVal, 0, 5)) {
      errors.training_effect_aerobic = 'Efeito aeróbico deve ser entre 0 e 5';
    }

    const teAnaerobicVal = parseFloat(formData.training_effect_anaerobic);
    if (isNaN(teAnaerobicVal) || !validateNumericRange(teAnaerobicVal, 0, 5)) {
      errors.training_effect_anaerobic = 'Efeito anaeróbico deve ser entre 0 e 5';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!athleteId) return;
    if (!validateForm()) {
      showToast('Corrija os campos inválidos antes de salvar.', 'error');
      return;
    }

    const recordData = {
      id: editingId ?? undefined,
      date: formData.date,
      workout_type: formData.workout_type,
      duration_minutes: parseFloat(formData.duration_minutes),
      distance_km: parseFloat(formData.distance_km),
      elevation_gain: parseFloat(formData.elevation_gain),
      avg_hr: parseFloat(formData.avg_hr),
      max_hr: parseFloat(formData.max_hr),
      avg_speed_kph: parseFloat(formData.avg_speed_kph),
      avg_pace_min_km: paceToDecimal(formData.avg_pace_min_km),
      tss: parseFloat(formData.tss),
      intensity_factor: parseFloat(formData.intensity_factor),
      training_effect_aerobic: parseFloat(formData.training_effect_aerobic),
      training_effect_anaerobic: parseFloat(formData.training_effect_anaerobic),
    };

    setSaving(true);
    try {
      await saveTrainingRecord(athleteId, recordData);
      await loadRecords();
      setShowForm(false);
      setEditingId(null);
      setFormData(getEmptyFormData());
      setFieldErrors({});
      showToast('Treino salvo com sucesso!', 'success');
    } catch {
      showToast('Erro ao salvar o treino.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="training-screen">
      <Header />

      <main className="training-content">
        <div className="training-header-row">
          <div className="training-header-left">
            <button className="training-back-btn" onClick={() => navigate('/home')} aria-label="Voltar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="training-title">Informações de Treino</h1>
          </div>
          <button className="training-add-btn" onClick={handleAdd}>
            Adicionar
          </button>
        </div>

        <div className="training-filters">
          <div className="training-filter-group">
            <label htmlFor="training-filter-date-from">De</label>
            <input
              id="training-filter-date-from"
              type="date"
              value={filterDateFrom}
              onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
            />
          </div>
          <div className="training-filter-group">
            <label htmlFor="training-filter-date-to">Até</label>
            <input
              id="training-filter-date-to"
              type="date"
              value={filterDateTo}
              onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
            />
          </div>
          <div className="training-filter-group">
            <label htmlFor="training-filter-type">Tipo de Treino</label>
            <select
              id="training-filter-type"
              value={filterWorkoutType}
              onChange={(e) => { setFilterWorkoutType(e.target.value); setPage(1); }}
            >
              <option value="">Todos</option>
              {WORKOUT_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          {(filterDateFrom || filterDateTo || filterWorkoutType) && (
            <button
              className="training-filter-clear"
              onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setFilterWorkoutType(''); setPage(1); }}
            >
              Limpar
            </button>
          )}
        </div>

        {showForm && (
          <div className="training-modal-overlay" role="dialog" aria-modal="true" aria-label={editingId ? 'Editar Registro' : 'Novo Registro'}>
            <div className="training-modal-content">
              <h2 className="training-form-title">
                {editingId ? 'Editar Registro' : 'Novo Registro'}
              </h2>

              <div className="training-form-fields">
                {/* Date */}
                <div className="training-form-group">
                  <label htmlFor="training-date">Data</label>
                  <input
                    id="training-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                  />
                  {fieldErrors.date && <span className="field-error">{fieldErrors.date}</span>}
                </div>

                {/* Workout Type */}
                <div className="training-form-group">
                  <label htmlFor="training-workout-type">Tipo de Treino</label>
                  <select
                    id="training-workout-type"
                    value={formData.workout_type}
                    onChange={(e) => handleFieldChange('workout_type', e.target.value)}
                  >
                    {WORKOUT_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div className="training-form-group">
                  <label htmlFor="training-duration">Duração (min)</label>
                  <input
                    id="training-duration"
                    type="number"
                    min="1"
                    max="1440"
                    value={formData.duration_minutes}
                    onChange={(e) => handleFieldChange('duration_minutes', e.target.value)}
                  />
                  {fieldErrors.duration_minutes && (
                    <span className="field-error">{fieldErrors.duration_minutes}</span>
                  )}
                </div>

                {/* Distance */}
                <div className="training-form-group">
                  <label htmlFor="training-distance">Distância (km)</label>
                  <input
                    id="training-distance"
                    type="number"
                    min="0.01"
                    max="500"
                    step="0.01"
                    value={formData.distance_km}
                    onChange={(e) => handleFieldChange('distance_km', e.target.value)}
                  />
                  {fieldErrors.distance_km && (
                    <span className="field-error">{fieldErrors.distance_km}</span>
                  )}
                </div>

                {/* Elevation Gain */}
                <div className="training-form-group">
                  <label htmlFor="training-elevation">Elevação (m)</label>
                  <input
                    id="training-elevation"
                    type="number"
                    min="0"
                    max="10000"
                    value={formData.elevation_gain}
                    onChange={(e) => handleFieldChange('elevation_gain', e.target.value)}
                  />
                  {fieldErrors.elevation_gain && (
                    <span className="field-error">{fieldErrors.elevation_gain}</span>
                  )}
                </div>

                {/* Average HR */}
                <div className="training-form-group">
                  <label htmlFor="training-avg-hr">FC Média (bpm)</label>
                  <input
                    id="training-avg-hr"
                    type="number"
                    min="30"
                    max="250"
                    value={formData.avg_hr}
                    onChange={(e) => handleFieldChange('avg_hr', e.target.value)}
                  />
                  {fieldErrors.avg_hr && (
                    <span className="field-error">{fieldErrors.avg_hr}</span>
                  )}
                </div>

                {/* Max HR */}
                <div className="training-form-group">
                  <label htmlFor="training-max-hr">FC Máxima (bpm)</label>
                  <input
                    id="training-max-hr"
                    type="number"
                    min="30"
                    max="250"
                    value={formData.max_hr}
                    onChange={(e) => handleFieldChange('max_hr', e.target.value)}
                  />
                  {fieldErrors.max_hr && (
                    <span className="field-error">{fieldErrors.max_hr}</span>
                  )}
                </div>

                {/* Average Speed */}
                <div className="training-form-group">
                  <label htmlFor="training-avg-speed">Velocidade Média (km/h)</label>
                  <input
                    id="training-avg-speed"
                    type="number"
                    min="0.1"
                    max="50"
                    step="0.1"
                    value={formData.avg_speed_kph}
                    onChange={(e) => handleFieldChange('avg_speed_kph', e.target.value)}
                  />
                  {fieldErrors.avg_speed_kph && (
                    <span className="field-error">{fieldErrors.avg_speed_kph}</span>
                  )}
                </div>

                {/* Average Pace */}
                <div className="training-form-group">
                  <label htmlFor="training-avg-pace">Pace Médio (mm:ss)</label>
                  <input
                    id="training-avg-pace"
                    type="text"
                    placeholder="05:30"
                    value={formData.avg_pace_min_km}
                    onChange={(e) => handleFieldChange('avg_pace_min_km', e.target.value)}
                  />
                  {fieldErrors.avg_pace_min_km && (
                    <span className="field-error">{fieldErrors.avg_pace_min_km}</span>
                  )}
                </div>

                {/* TSS */}
                <div className="training-form-group">
                  <label htmlFor="training-tss">TSS</label>
                  <input
                    id="training-tss"
                    type="number"
                    min="0"
                    max="1000"
                    value={formData.tss}
                    onChange={(e) => handleFieldChange('tss', e.target.value)}
                  />
                  {fieldErrors.tss && (
                    <span className="field-error">{fieldErrors.tss}</span>
                  )}
                </div>

                {/* Intensity Factor */}
                <div className="training-form-group">
                  <label htmlFor="training-intensity">Fator de Intensidade (0-10)</label>
                  <input
                    id="training-intensity"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.intensity_factor}
                    onChange={(e) => handleFieldChange('intensity_factor', e.target.value)}
                  />
                  {fieldErrors.intensity_factor && (
                    <span className="field-error">{fieldErrors.intensity_factor}</span>
                  )}
                </div>

                {/* Training Effect Aerobic */}
                <div className="training-form-group">
                  <label htmlFor="training-te-aerobic">Efeito Aeróbico (0-5)</label>
                  <input
                    id="training-te-aerobic"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.training_effect_aerobic}
                    onChange={(e) => handleFieldChange('training_effect_aerobic', e.target.value)}
                  />
                  {fieldErrors.training_effect_aerobic && (
                    <span className="field-error">{fieldErrors.training_effect_aerobic}</span>
                  )}
                </div>

                {/* Training Effect Anaerobic */}
                <div className="training-form-group">
                  <label htmlFor="training-te-anaerobic">Efeito Anaeróbico (0-5)</label>
                  <input
                    id="training-te-anaerobic"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.training_effect_anaerobic}
                    onChange={(e) => handleFieldChange('training_effect_anaerobic', e.target.value)}
                  />
                  {fieldErrors.training_effect_anaerobic && (
                    <span className="field-error">{fieldErrors.training_effect_anaerobic}</span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="training-form-actions">
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Records table */}
        {loading ? (
          <p className="training-empty">Carregando...</p>
        ) : records.length === 0 ? (
          <p className="training-empty">Nenhum registro encontrado</p>
        ) : (
          <>
            <div className="training-table-container">
              <table className="training-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('activity_date')}>Data{sortIndicator('activity_date')}</th>
                    <th className="sortable" onClick={() => handleSort('workout_type')}>Tipo de Treino{sortIndicator('workout_type')}</th>
                    <th className="sortable" onClick={() => handleSort('distance_km')}>Distância (km){sortIndicator('distance_km')}</th>
                    <th className="sortable" onClick={() => handleSort('tss')}>TSS{sortIndicator('tss')}</th>
                    <th>Editar</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>{record.workout_type}</td>
                      <td>{record.distance_km}</td>
                      <td>{record.tss}</td>
                      <td>
                        <button
                          className="training-edit-btn"
                          onClick={() => handleEdit(record)}
                          aria-label={`Editar registro de ${record.date}`}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="training-pagination">
              <button
                className="training-page-btn"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <span className="training-page-info">
                Página {page} de {totalPages} ({total} registros)
              </span>
              <button
                className="training-page-btn"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
