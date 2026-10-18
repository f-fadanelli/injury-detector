import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import Footer from '../components/Footer';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { getDailyRecords, saveDailyRecord } from '../services/dataService';
import { validateNumericRange } from '../utils/validators';
import {
  READINESS_MORNING_OPTIONS,
  READINESS_EVENING_OPTIONS,
  STRESS_OPTIONS,
  closestOption,
} from '../utils/scales';
import type { DailyRecord, SortDir } from '../types';
import './DailyInfoScreen.css';

interface FormData {
  date: string;
  resting_hr: string;
  hrv: string;
  sleep_hours: string;
  sleep_quality: string;
  deep_sleep: string;
  light_sleep: string;
  rem_sleep: string;
  // prontidão/estresse guardados como número (frase -> valor)
  body_battery_morning: number | '';
  body_battery_evening: number | '';
  stress: number | '';
}

interface FieldValidation {
  field: string;
  min: number;
  max: number;
  label: string;
}

// Validações numéricas apenas dos campos digitados livremente.
const FIELD_VALIDATIONS: FieldValidation[] = [
  { field: 'resting_hr', min: 30, max: 220, label: 'FC Repouso' },
  { field: 'hrv', min: 0, max: 300, label: 'HRV' },
  { field: 'sleep_hours', min: 0, max: 24, label: 'Horas de sono' },
  { field: 'sleep_quality', min: 0, max: 10, label: 'Qualidade do sono' },
  { field: 'deep_sleep', min: 0, max: 24, label: 'Sono profundo' },
  { field: 'light_sleep', min: 0, max: 24, label: 'Sono leve' },
  { field: 'rem_sleep', min: 0, max: 24, label: 'Sono REM' },
];

function getEmptyFormData(): FormData {
  const today = new Date().toISOString().split('T')[0];
  return {
    date: today,
    resting_hr: '',
    hrv: '',
    sleep_hours: '',
    sleep_quality: '',
    deep_sleep: '',
    light_sleep: '',
    rem_sleep: '',
    body_battery_morning: '',
    body_battery_evening: '',
    stress: '',
  };
}

function recordToFormData(record: DailyRecord): FormData {
  return {
    date: record.date,
    resting_hr: String(record.resting_hr),
    hrv: String(record.hrv),
    sleep_hours: String(record.sleep_hours),
    sleep_quality: String(record.sleep_quality),
    deep_sleep: String(record.deep_sleep),
    light_sleep: String(record.light_sleep),
    rem_sleep: String(record.rem_sleep),
    body_battery_morning:
      closestOption(READINESS_MORNING_OPTIONS, record.body_battery_morning)?.value ?? '',
    body_battery_evening:
      closestOption(READINESS_EVENING_OPTIONS, record.body_battery_evening)?.value ?? '',
    stress: closestOption(STRESS_OPTIONS, record.stress)?.value ?? '',
  };
}

export function DailyInfoScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { athleteId } = useAuth();

  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(getEmptyFormData());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Paginação / ordenação (server-side)
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>('record_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  async function loadRecords() {
    if (!athleteId) return;
    setLoading(true);
    try {
      const res = await getDailyRecords(athleteId, {
        page,
        pageSize,
        sortBy,
        sortDir,
        from: filterDateFrom || undefined,
        to: filterDateTo || undefined,
      });
      setRecords(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      showToast('Erro ao carregar registros diários.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  }, [athleteId, page, pageSize, sortBy, sortDir, filterDateFrom, filterDateTo]);

  // Clicar num cabeçalho ordena por aquele campo; reclica inverte a direção.
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

  function handleEdit(record: DailyRecord) {
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

  function handleFieldChange(field: keyof FormData, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    for (const v of FIELD_VALIDATIONS) {
      const value = formData[v.field as keyof FormData];
      if (value === '') continue;
      const num = Number(value);
      if (isNaN(num) || !validateNumericRange(num, v.min, v.max)) {
        errors[v.field] = `${v.label} deve estar entre ${v.min} e ${v.max}`;
      }
    }
    if (formData.body_battery_morning === '')
      errors.body_battery_morning = 'Selecione a prontidão da manhã';
    if (formData.body_battery_evening === '')
      errors.body_battery_evening = 'Selecione a prontidão da noite';
    if (formData.stress === '') errors.stress = 'Selecione o nível de estresse';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!athleteId) return;
    if (!validateForm()) {
      showToast('Corrija os campos inválidos antes de salvar.', 'error');
      return;
    }

    const recordData: Omit<DailyRecord, 'id'> = {
      date: formData.date,
      resting_hr: Number(formData.resting_hr) || 0,
      hrv: Number(formData.hrv) || 0,
      sleep_hours: Number(formData.sleep_hours) || 0,
      sleep_quality: Number(formData.sleep_quality) || 0,
      deep_sleep: Number(formData.deep_sleep) || 0,
      light_sleep: Number(formData.light_sleep) || 0,
      rem_sleep: Number(formData.rem_sleep) || 0,
      body_battery_morning: Number(formData.body_battery_morning) || 0,
      body_battery_evening: Number(formData.body_battery_evening) || 0,
      stress: Number(formData.stress) || 0,
    };

    setSaving(true);
    try {
      await saveDailyRecord(athleteId, recordData);
      await loadRecords();
      setShowForm(false);
      setEditingId(null);
      setFormData(getEmptyFormData());
      setFieldErrors({});
      showToast('Registro salvo com sucesso!', 'success');
    } catch {
      showToast('Erro ao salvar o registro.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="daily-info-screen">
      <Header />

      <main className="daily-info-content">
        <div className="daily-info-header-row">
          <div className="daily-info-header-left">
            <button className="daily-info-back-btn" onClick={() => navigate('/home')} aria-label="Voltar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="daily-info-title">Informações Diárias</h1>
          </div>
          <button className="daily-info-add-btn" onClick={handleAdd}>
            Adicionar
          </button>
        </div>

        <div className="daily-info-filters">
          <div className="daily-info-filter-group">
            <label htmlFor="filter-date-from">De</label>
            <input id="filter-date-from" type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div className="daily-info-filter-group">
            <label htmlFor="filter-date-to">Até</label>
            <input id="filter-date-to" type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }} />
          </div>
          {(filterDateFrom || filterDateTo) && (
            <button className="daily-info-filter-clear" onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setPage(1); }}>
              Limpar
            </button>
          )}
        </div>

        {showForm && (
          <div className="daily-info-modal-overlay" role="dialog" aria-modal="true" aria-label={editingId ? 'Editar Registro' : 'Novo Registro'}>
            <div className="daily-info-modal-content">
              <h2 className="daily-info-form-title">{editingId ? 'Editar Registro' : 'Novo Registro'}</h2>

              <div className="daily-info-form-fields">
                <div className="daily-info-form-group">
                  <label htmlFor="daily-date">Data</label>
                  <input id="daily-date" type="date" value={formData.date} onChange={(e) => handleFieldChange('date', e.target.value)} />
                </div>

                <div className="daily-info-form-group">
                  <label htmlFor="daily-resting-hr">FC Repouso (30-220 bpm)</label>
                  <input id="daily-resting-hr" type="number" min={30} max={220} value={formData.resting_hr} onChange={(e) => handleFieldChange('resting_hr', e.target.value)} className={fieldErrors.resting_hr ? 'input-error' : ''} placeholder="30 - 220" />
                  {fieldErrors.resting_hr && <span className="field-error">{fieldErrors.resting_hr}</span>}
                </div>

                <div className="daily-info-form-group">
                  <label htmlFor="daily-hrv">HRV (0-300 ms)</label>
                  <input id="daily-hrv" type="number" min={0} max={300} value={formData.hrv} onChange={(e) => handleFieldChange('hrv', e.target.value)} className={fieldErrors.hrv ? 'input-error' : ''} placeholder="0 - 300" />
                  {fieldErrors.hrv && <span className="field-error">{fieldErrors.hrv}</span>}
                </div>

                <div className="daily-info-form-group">
                  <label htmlFor="daily-sleep-hours">Horas de sono (0-24)</label>
                  <input id="daily-sleep-hours" type="number" min={0} max={24} step="0.1" value={formData.sleep_hours} onChange={(e) => handleFieldChange('sleep_hours', e.target.value)} className={fieldErrors.sleep_hours ? 'input-error' : ''} placeholder="0 - 24" />
                  {fieldErrors.sleep_hours && <span className="field-error">{fieldErrors.sleep_hours}</span>}
                </div>

                <div className="daily-info-form-group">
                  <label htmlFor="daily-sleep-quality">Qualidade do sono (0-10)</label>
                  <input id="daily-sleep-quality" type="number" min={0} max={10} value={formData.sleep_quality} onChange={(e) => handleFieldChange('sleep_quality', e.target.value)} className={fieldErrors.sleep_quality ? 'input-error' : ''} placeholder="0 - 10" />
                  {fieldErrors.sleep_quality && <span className="field-error">{fieldErrors.sleep_quality}</span>}
                </div>

                <div className="daily-info-form-group">
                  <label htmlFor="daily-deep-sleep">Sono profundo (0-24 h)</label>
                  <input id="daily-deep-sleep" type="number" min={0} max={24} step="0.1" value={formData.deep_sleep} onChange={(e) => handleFieldChange('deep_sleep', e.target.value)} className={fieldErrors.deep_sleep ? 'input-error' : ''} placeholder="0 - 24" />
                  {fieldErrors.deep_sleep && <span className="field-error">{fieldErrors.deep_sleep}</span>}
                </div>

                <div className="daily-info-form-group">
                  <label htmlFor="daily-light-sleep">Sono leve (0-24 h)</label>
                  <input id="daily-light-sleep" type="number" min={0} max={24} step="0.1" value={formData.light_sleep} onChange={(e) => handleFieldChange('light_sleep', e.target.value)} className={fieldErrors.light_sleep ? 'input-error' : ''} placeholder="0 - 24" />
                  {fieldErrors.light_sleep && <span className="field-error">{fieldErrors.light_sleep}</span>}
                </div>

                <div className="daily-info-form-group">
                  <label htmlFor="daily-rem-sleep">Sono REM (0-24 h)</label>
                  <input id="daily-rem-sleep" type="number" min={0} max={24} step="0.1" value={formData.rem_sleep} onChange={(e) => handleFieldChange('rem_sleep', e.target.value)} className={fieldErrors.rem_sleep ? 'input-error' : ''} placeholder="0 - 24" />
                  {fieldErrors.rem_sleep && <span className="field-error">{fieldErrors.rem_sleep}</span>}
                </div>

                {/* Percepção de prontidão (manhã) - frases */}
                <div className="daily-info-form-group">
                  <label htmlFor="daily-readiness-morning">Como você acordou hoje?</label>
                  <select id="daily-readiness-morning" value={formData.body_battery_morning} onChange={(e) => handleFieldChange('body_battery_morning', e.target.value === '' ? '' : Number(e.target.value))} className={fieldErrors.body_battery_morning ? 'input-error' : ''}>
                    <option value="">Selecione</option>
                    {READINESS_MORNING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {fieldErrors.body_battery_morning && <span className="field-error">{fieldErrors.body_battery_morning}</span>}
                </div>

                {/* Percepção de prontidão (noite) - frases */}
                <div className="daily-info-form-group">
                  <label htmlFor="daily-readiness-evening">Como você terminou o dia?</label>
                  <select id="daily-readiness-evening" value={formData.body_battery_evening} onChange={(e) => handleFieldChange('body_battery_evening', e.target.value === '' ? '' : Number(e.target.value))} className={fieldErrors.body_battery_evening ? 'input-error' : ''}>
                    <option value="">Selecione</option>
                    {READINESS_EVENING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {fieldErrors.body_battery_evening && <span className="field-error">{fieldErrors.body_battery_evening}</span>}
                </div>

                {/* Estresse - frases */}
                <div className="daily-info-form-group">
                  <label htmlFor="daily-stress">Nível de estresse do dia</label>
                  <select id="daily-stress" value={formData.stress} onChange={(e) => handleFieldChange('stress', e.target.value === '' ? '' : Number(e.target.value))} className={fieldErrors.stress ? 'input-error' : ''}>
                    <option value="">Selecione</option>
                    {STRESS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {fieldErrors.stress && <span className="field-error">{fieldErrors.stress}</span>}
                </div>
              </div>

              <div className="daily-info-form-actions">
                <button className="daily-info-save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button className="daily-info-cancel-btn" onClick={handleCancel}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p className="daily-info-empty">Carregando...</p>
        ) : records.length === 0 ? (
          <p className="daily-info-empty">Nenhum registro encontrado</p>
        ) : (
          <>
            <div className="daily-info-table-container">
              <table className="daily-info-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('record_date')}>Data{sortIndicator('record_date')}</th>
                    <th className="sortable" onClick={() => handleSort('resting_hr')}>FC Repouso{sortIndicator('resting_hr')}</th>
                    <th className="sortable" onClick={() => handleSort('sleep_hours')}>Horas de Sono{sortIndicator('sleep_hours')}</th>
                    <th className="sortable" onClick={() => handleSort('stress')}>Estresse{sortIndicator('stress')}</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>{record.resting_hr} bpm</td>
                      <td>{record.sleep_hours} h</td>
                      <td>{record.stress}</td>
                      <td>
                        <button className="daily-info-edit-btn" onClick={() => handleEdit(record)} aria-label={`Editar registro de ${record.date}`}>
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

            <div className="daily-info-pagination">
              <button
                className="daily-info-page-btn"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
              >
                Anterior
              </button>
              <span className="daily-info-page-info">
                Página {page} de {totalPages} ({total} registros)
              </span>
              <button
                className="daily-info-page-btn"
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
