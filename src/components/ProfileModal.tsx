import { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { getAthleteProfile, updateAthleteProfile } from '../services/dataService';
import { validateRequired, validateNumericRange } from '../utils/validators';
import type { LifestyleOption } from '../types';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LIFESTYLE_OPTIONS: LifestyleOption[] = [
  'Competidor Equilibrado',
  'Atleta Consciente da Saúde',
  'Atleta Altamente Disciplinado',
  'Workaholic com Privação de Sono',
  'Atleta Sub-Recuperado',
  'Socializador de Fim de Semana',
];

const TAB_LABELS = ['Informações Básicas', 'Informações Complementares'];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { showToast } = useToast();
  const { athleteId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);

  // Tab 1
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  // Tab 2
  const [trainingExperience, setTrainingExperience] = useState('');
  const [lifestyle, setLifestyle] = useState('');
  const [drinkingFactor, setDrinkingFactor] = useState('');
  const [nutritionFactor, setNutritionFactor] = useState('');

  useEffect(() => {
    if (!isOpen || !athleteId) return;
    (async () => {
      try {
        const p = await getAthleteProfile(athleteId);
        setName(p.name ?? '');
        setGender(p.gender ?? '');
        setAge(p.age != null ? String(p.age) : '');
        setHeightCm(p.height_cm != null ? String(p.height_cm) : '');
        setWeightKg(p.weight_kg != null ? String(p.weight_kg) : '');
        setTrainingExperience(
          p.training_experience != null ? String(p.training_experience) : ''
        );
        setLifestyle(p.lifestyle ?? '');
        setDrinkingFactor(p.drinking_factor != null ? String(p.drinking_factor) : '');
        setNutritionFactor(p.nutrition_factor != null ? String(p.nutrition_factor) : '');
        setActiveTab(0);
      } catch {
        showToast('Erro ao carregar o perfil.', 'error');
      }
    })();
  }, [isOpen, athleteId, showToast]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      showToast('Formato de arquivo inválido. Use JPEG ou PNG.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Arquivo muito grande. Tamanho máximo: 5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!athleteId) return;
    const missing: string[] = [];
    if (!validateRequired(name)) missing.push('Nome');
    if (!validateRequired(gender)) missing.push('Gênero');
    if (!validateRequired(age)) missing.push('Idade');
    if (!validateRequired(heightCm)) missing.push('Altura');
    if (!validateRequired(weightKg)) missing.push('Peso');
    if (missing.length > 0) {
      showToast(`Campos obrigatórios faltando: ${missing.join(', ')}`, 'error');
      return;
    }

    const ageN = Number(age);
    const height = Number(heightCm);
    const weight = Number(weightKg);

    if (!validateNumericRange(ageN, 10, 100)) {
      showToast('Idade deve estar entre 10 e 100 anos.', 'error');
      return;
    }
    if (!validateNumericRange(height, 100, 250)) {
      showToast('Altura deve estar entre 100 e 250 cm.', 'error');
      return;
    }
    if (!validateNumericRange(weight, 30, 300)) {
      showToast('Peso deve estar entre 30 e 300 kg.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateAthleteProfile(athleteId, {
        name: name.trim(),
        gender,
        age: ageN,
        height_cm: height,
        weight_kg: weight,
        training_experience: trainingExperience !== '' ? Number(trainingExperience) : 0,
        lifestyle: lifestyle || 'Competidor Equilibrado',
        drinking_factor: drinkingFactor !== '' ? Number(drinkingFactor) : null,
        nutrition_factor: nutritionFactor !== '' ? Number(nutritionFactor) : null,
      });
      showToast('Perfil atualizado com sucesso!', 'success');
      onClose();
    } catch {
      showToast('Erro ao salvar o perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-modal-overlay" role="dialog" aria-modal="true" aria-label="Editar Perfil" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="profile-modal-title">Editar Perfil</h2>

        <div className="profile-modal-tabs">
          {TAB_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`profile-modal-tab ${index === activeTab ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 0 && (
          <div className="profile-modal-tab-content">
            <div className="form-group">
              <label htmlFor="profile-photo-upload">Foto</label>
              <div className="photo-upload-area">
                {photo && <img src={photo} alt="Preview" className="photo-preview" />}
                <button type="button" className="photo-upload-btn" onClick={() => fileInputRef.current?.click()}>
                  {photo ? 'Alterar foto' : 'Selecionar foto'}
                </button>
                <input ref={fileInputRef} id="profile-photo-upload" type="file" accept="image/jpeg,image/png" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="profile-name">Nome *</label>
              <input id="profile-name" type="text" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
            </div>

            <div className="form-group">
              <label htmlFor="profile-gender">Gênero *</label>
              <select id="profile-gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="profile-age">Idade *</label>
              <input id="profile-age" type="number" min={10} max={100} value={age} onChange={(e) => setAge(e.target.value)} placeholder="10 - 100" />
            </div>

            <div className="form-group">
              <label htmlFor="profile-height">Altura (cm) *</label>
              <input id="profile-height" type="number" min={100} max={250} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="100 - 250" />
            </div>

            <div className="form-group">
              <label htmlFor="profile-weight">Peso (kg) *</label>
              <input id="profile-weight" type="number" min={30} max={300} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="30 - 300" />
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="profile-modal-tab-content">
            <div className="form-group">
              <label htmlFor="profile-training-experience">Experiência de treino (anos)</label>
              <input id="profile-training-experience" type="number" min={0} max={50} value={trainingExperience} onChange={(e) => setTrainingExperience(e.target.value)} placeholder="0 - 50" />
            </div>

            <div className="form-group">
              <label htmlFor="profile-lifestyle">Estilo de vida</label>
              <select id="profile-lifestyle" value={lifestyle} onChange={(e) => setLifestyle(e.target.value)}>
                <option value="">Selecione</option>
                {LIFESTYLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="profile-drinking-factor">Consumo de álcool (0 = baixo, 10 = alto)</label>
              <input id="profile-drinking-factor" type="number" min={0} max={10} value={drinkingFactor} onChange={(e) => setDrinkingFactor(e.target.value)} placeholder="0 - 10" />
            </div>

            <div className="form-group">
              <label htmlFor="profile-nutrition-factor">Qualidade da nutrição (0 = ruim, 10 = ótima)</label>
              <input id="profile-nutrition-factor" type="number" min={0} max={10} value={nutritionFactor} onChange={(e) => setNutritionFactor(e.target.value)} placeholder="0 - 10" />
            </div>
          </div>
        )}

        <div className="profile-modal-actions">
          <button type="button" className="profile-modal-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="profile-modal-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
