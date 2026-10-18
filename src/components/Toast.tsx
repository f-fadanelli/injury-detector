import { useEffect } from 'react';
import type { ToastType } from '../types';

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const truncatedMessage = message.length > 150 ? message.slice(0, 150) : message;

  const borderColor = type === 'success' ? 'var(--success)' : 'var(--error)';

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        backgroundColor: '#FFFFFF',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 'var(--radius)',
        padding: '12px 16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        maxWidth: '360px',
        wordBreak: 'break-word',
      }}
    >
      {truncatedMessage}
    </div>
  );
}
