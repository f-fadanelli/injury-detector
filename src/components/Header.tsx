import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmationModal } from './ConfirmationModal';
import { ProfileModal } from './ProfileModal';
import logo from '../assets/corraMep_logo1.png';

export function Header() {
  const { athleteName, athletePhoto, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  function handleProfileClick() {
    setIsProfileModalOpen(true);
  }

  function handleLogoutClick() {
    setIsLogoutModalOpen(true);
  }

  function handleConfirmLogout() {
    setIsLogoutModalOpen(false);
    logout();
    navigate('/login');
  }

  function handleCancelLogout() {
    setIsLogoutModalOpen(false);
  }

  const firstLetter = athleteName ? athleteName.charAt(0).toUpperCase() : '?';

  return (
    <>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        backgroundColor: 'var(--background)',
        borderBottom: '1px solid var(--border)',
        width: '100%',
      }}>
        {/* Logo - top left */}
        <div>
          <img
            src={logo}
            alt="CorraMEP Logo"
            style={{ height: '40px', width: 'auto' }}
          />
        </div>

        {/* Profile + Logout - top right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {/* Profile photo or badge */}
          <button
            onClick={handleProfileClick}
            aria-label="Abrir perfil"
            style={{
              border: 'none',
              background: 'none',
              padding: 0,
              cursor: 'pointer',
              borderRadius: '50%',
            }}
          >
            {athletePhoto ? (
              <img
                src={athletePhoto}
                alt="Foto de perfil"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {firstLetter}
              </div>
            )}
          </button>

          {/* Logout icon */}
          <button
            onClick={handleLogoutClick}
            aria-label="Sair"
            style={{
              border: 'none',
              background: 'none',
              padding: 'var(--spacing-xs)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        message="Deseja realmente sair?"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
}
