// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { SignInScreen } from './SignInScreen';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';

function renderWithProviders(ui: ReactNode) {
  return render(
    <AuthProvider>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </AuthProvider>
  );
}

describe('SignInScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the CorraMEP logo', () => {
    renderWithProviders(<SignInScreen />);
    const logo = screen.getByAltText('CorraMEP Logo');
    expect(logo).toBeDefined();
  });

  it('renders email and password inputs', () => {
    renderWithProviders(<SignInScreen />);
    expect(screen.getByLabelText('E-mail')).toBeDefined();
    expect(screen.getByLabelText('Senha')).toBeDefined();
  });

  it('renders the Entrar button disabled initially', () => {
    renderWithProviders(<SignInScreen />);
    const button = screen.getByRole('button', { name: 'Entrar' });
    expect(button).toBeDefined();
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables the Entrar button when both email and password are non-empty', () => {
    renderWithProviders(<SignInScreen />);
    const emailInput = screen.getByLabelText('E-mail');
    const passwordInput = screen.getByLabelText('Senha');
    const button = screen.getByRole('button', { name: 'Entrar' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });

    expect((button as HTMLButtonElement).disabled).toBe(false);
  });

  it('keeps button disabled when only email is filled', () => {
    renderWithProviders(<SignInScreen />);
    const emailInput = screen.getByLabelText('E-mail');
    const button = screen.getByRole('button', { name: 'Entrar' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('keeps button disabled when only password is filled', () => {
    renderWithProviders(<SignInScreen />);
    const passwordInput = screen.getByLabelText('Senha');
    const button = screen.getByRole('button', { name: 'Entrar' });

    fireEvent.change(passwordInput, { target: { value: 'password' } });

    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows inline error for invalid email format on submit', () => {
    renderWithProviders(<SignInScreen />);
    const emailInput = screen.getByLabelText('E-mail');
    const passwordInput = screen.getByLabelText('Senha');
    const button = screen.getByRole('button', { name: 'Entrar' });

    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(button);

    const error = screen.getByRole('alert');
    expect(error.textContent).toBe('Formato de e-mail inválido.');
  });

  // Os testes de login com credenciais reais ficam para a Etapa 7
  // (teste ponta a ponta), pois agora dependem da API/JWT.

  it('renders the Cadastre-se link', () => {
    renderWithProviders(<SignInScreen />);
    const link = screen.getByText('Cadastre-se');
    expect(link).toBeDefined();
    expect(link.tagName).toBe('A');
  });

  it('navigates to /register when Cadastre-se is clicked', () => {
    renderWithProviders(<SignInScreen />);
    const link = screen.getByText('Cadastre-se');
    fireEvent.click(link);
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('password input has type password (masked)', () => {
    renderWithProviders(<SignInScreen />);
    const passwordInput = screen.getByLabelText('Senha') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
  });
});
