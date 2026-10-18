import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { validateEmail } from '../utils/validators';
import logo from '../assets/corraMep_logo1.png';
import './SignInScreen.css';

export function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const isSubmitDisabled =
    email.trim() === '' || password.trim() === '' || submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEmailError('');

    if (!validateEmail(email)) {
      setEmailError('Formato de e-mail inválido.');
      return;
    }

    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);

    if (success) {
      showToast('Login efetuado com sucesso!', 'success');
      navigate('/home');
    } else {
      showToast('Usuário ou senha incorretos!', 'error');
    }
  }

  return (
    <div className="signin-container">
      <div className="signin-card">
        <img src={logo} alt="CorraMEP Logo" className="signin-logo" />

        <form onSubmit={handleSubmit} className="signin-form" noValidate>
          <div className="signin-field">
            <label htmlFor="signin-email">E-mail</label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              placeholder="Digite seu e-mail"
              autoComplete="email"
            />
            {emailError && (
              <span className="signin-error" role="alert">
                {emailError}
              </span>
            )}
          </div>

          <div className="signin-field">
            <label htmlFor="signin-password">Senha</label>
            <input
              id="signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="signin-button"
            disabled={isSubmitDisabled}
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="signin-register-link">
          Não tem uma conta?{' '}
          <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}
