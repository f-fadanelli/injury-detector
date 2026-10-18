import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { apiRequest, setToken } from '../services/apiClient';
import { validateEmail, validateNumericRange, validateRequired, validatePassword } from '../utils/validators';
import type { LifestyleOption } from '../types';
import logo from '../assets/corraMep_logo1.png';
import './RegistrationScreen.css';

/** Calcula idade a partir de dia/mês/ano de nascimento. */
function calcAge(day: number, month: number, year: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) age--;
  return age;
}

const LIFESTYLE_OPTIONS: LifestyleOption[] = [
  'Competidor Equilibrado',
  'Atleta Consciente da Saúde',
  'Atleta Altamente Disciplinado',
  'Workaholic com Privação de Sono',
  'Atleta Sub-Recuperado',
  'Socializador de Fim de Semana',
];

const TAB_LABELS = ['Informações Básicas', 'Informações Complementares', 'Finalizar'];

const currentYear = new Date().getFullYear();

export function RegistrationScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState(0);

  // Tab 1 fields
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  // Tab 2 fields
  const [trainingExperience, setTrainingExperience] = useState('');
  const [lifestyle, setLifestyle] = useState('');
  const [drinkingFactor, setDrinkingFactor] = useState('');
  const [nutritionFactor, setNutritionFactor] = useState('');

  // Tab 3 fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    reader.onload = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const missingFields: string[] = [];

    if (!validateRequired(name)) missingFields.push('Nome');
    if (!validateRequired(gender)) missingFields.push('Gênero');
    if (!validateRequired(birthDay) || !validateRequired(birthMonth) || !validateRequired(birthYear)) {
      missingFields.push('Data de nascimento');
    }
    if (!validateRequired(heightCm)) missingFields.push('Altura');
    if (!validateRequired(weightKg)) missingFields.push('Peso');
    if (!validateRequired(email)) missingFields.push('Email');
    if (!validateRequired(password)) missingFields.push('Senha');

    if (missingFields.length > 0) {
      showToast(`Campos obrigatórios faltando: ${missingFields.join(', ')}`, 'error');
      return;
    }

    const height = Number(heightCm);
    const weight = Number(weightKg);

    if (!validateNumericRange(height, 100, 250)) {
      showToast('Altura deve estar entre 100 e 250 cm.', 'error');
      return;
    }
    if (!validateNumericRange(weight, 30, 300)) {
      showToast('Peso deve estar entre 30 e 300 kg.', 'error');
      return;
    }
    if (!validateEmail(email)) {
      showToast('Formato de email inválido.', 'error');
      return;
    }
    if (!validatePassword(password)) {
      showToast('A senha deve ter no mínimo 6 caracteres.', 'error');
      return;
    }

    const age = calcAge(Number(birthDay), Number(birthMonth), Number(birthYear));

    setSubmitting(true);
    try {
      // POST /athletes é público e retorna { token, athlete }
      const res = await apiRequest<{ token: string; athlete: { id: string } }>(
        '/athletes',
        {
          method: 'POST',
          auth: false,
          body: {
            name: name.trim(),
            gender,
            age,
            height_cm: height,
            weight_kg: weight,
            training_experience: trainingExperience !== '' ? Number(trainingExperience) : 0,
            lifestyle: lifestyle || 'Competidor Equilibrado',
            drinking_factor: drinkingFactor !== '' ? Number(drinkingFactor) : null,
            nutrition_factor: nutritionFactor !== '' ? Number(nutritionFactor) : null,
            email,
            password,
          },
        }
      );
      setToken(res.token);
      showToast('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
      navigate('/login');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao cadastrar';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTab1 = () => (
    <div className="registration-tab-content">
      <div className="form-group">
        <label htmlFor="photo-upload">Foto</label>
        <div className="photo-upload-area">
          {photo && (
            <img src={photo} alt="Preview" className="photo-preview" />
          )}
          <button
            type="button"
            className="photo-upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            {photo ? 'Alterar foto' : 'Selecionar foto'}
          </button>
          <input
            ref={fileInputRef}
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="name">Nome *</label>
        <input
          id="name"
          type="text"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome completo"
        />
      </div>

      <div className="form-group">
        <label htmlFor="gender">Gênero *</label>
        <select
          id="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">Selecione</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
        </select>
      </div>

      <div className="form-group">
        <label>Data de nascimento *</label>
        <div className="birth-date-row">
          <select
            aria-label="Dia"
            value={birthDay}
            onChange={(e) => setBirthDay(e.target.value)}
          >
            <option value="">Dia</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            aria-label="Mês"
            value={birthMonth}
            onChange={(e) => setBirthMonth(e.target.value)}
          >
            <option value="">Mês</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            aria-label="Ano"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
          >
            <option value="">Ano</option>
            {Array.from({ length: currentYear - 1924 + 1 }, (_, i) => currentYear - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="height">Altura (cm) *</label>
        <input
          id="height"
          type="number"
          min={100}
          max={250}
          value={heightCm}
          onChange={(e) => setHeightCm(e.target.value)}
          placeholder="100 - 250"
        />
      </div>

      <div className="form-group">
        <label htmlFor="weight">Peso (kg) *</label>
        <input
          id="weight"
          type="number"
          min={30}
          max={300}
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          placeholder="30 - 300"
        />
      </div>
    </div>
  );

  const renderTab2 = () => (
    <div className="registration-tab-content">
      <div className="form-group">
        <label htmlFor="training-experience">Experiência de treino (anos)</label>
        <input
          id="training-experience"
          type="number"
          min={0}
          max={50}
          value={trainingExperience}
          onChange={(e) => setTrainingExperience(e.target.value)}
          placeholder="0 - 50"
        />
      </div>

      <div className="form-group">
        <label htmlFor="lifestyle">Estilo de vida</label>
        <select
          id="lifestyle"
          value={lifestyle}
          onChange={(e) => setLifestyle(e.target.value)}
        >
          <option value="">Selecione</option>
          {LIFESTYLE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="drinking-factor">Consumo de álcool (0 = baixo, 10 = alto)</label>
        <input
          id="drinking-factor"
          type="number"
          min={0}
          max={10}
          value={drinkingFactor}
          onChange={(e) => setDrinkingFactor(e.target.value)}
          placeholder="0 - 10"
        />
      </div>

      <div className="form-group">
        <label htmlFor="nutrition-factor">Qualidade da nutrição (0 = ruim, 10 = ótima)</label>
        <input
          id="nutrition-factor"
          type="number"
          min={0}
          max={10}
          value={nutritionFactor}
          onChange={(e) => setNutritionFactor(e.target.value)}
          placeholder="0 - 10"
        />
      </div>
    </div>
  );

  const renderTab3 = () => (
    <div className="registration-tab-content">
      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Senha *</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
        />
      </div>
    </div>
  );

  return (
    <div className="registration-screen">
      <div className="registration-container">
        <img src={logo} alt="CorraMEP Logo" className="registration-logo" />
        <h1 className="registration-title">Cadastro</h1>

        <div className="registration-tabs">
          {TAB_LABELS.map((label, index) => (
            <span
              key={label}
              className={`registration-tab-label ${index === activeTab ? 'active' : ''}`}
            >
              {label}
            </span>
          ))}
        </div>

        {activeTab === 0 && renderTab1()}
        {activeTab === 1 && renderTab2()}
        {activeTab === 2 && renderTab3()}

        <div className="registration-nav-buttons">
          {activeTab > 0 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setActiveTab(activeTab - 1)}
            >
              Voltar
            </button>
          )}
          {activeTab < 2 && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setActiveTab(activeTab + 1)}
            >
              Próximo
            </button>
          )}
          {activeTab === 2 && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          )}
        </div>

        <p className="registration-signin-link">
          Já tem uma conta? <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Entrar</a>
        </p>
      </div>
    </div>
  );
}
