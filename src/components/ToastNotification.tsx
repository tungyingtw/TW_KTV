import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const ToastNotification: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      className="toast-notification-container app-status-toast animate-fade-in"
      style={{
        bottom: 'var(--toast-bottom, 32px)',
        top: 'var(--toast-top, auto)',
        zIndex: 20000,
        borderColor: 'var(--border-color)',
      }}
    >
      <CheckCircle2 size={20} color="currentColor" />
      <span>{message}</span>
    </div>
  );
};
