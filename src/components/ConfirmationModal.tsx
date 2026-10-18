interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function ConfirmationModal({ message, onConfirm, onCancel, isOpen }: ConfirmationModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: 'var(--background)',
          borderRadius: 'var(--radius)',
          padding: 'var(--spacing-lg)',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-md)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ color: 'var(--text)', fontSize: 'var(--font-size-base)', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              border: 'none',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
