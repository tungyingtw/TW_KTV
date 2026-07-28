import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const ToastNotification: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="toast-notification-container glass-panel">
      <CheckCircle2 size={20} color="var(--accent-pink)" />
      <span>{message}</span>
    </div>
  );
};
