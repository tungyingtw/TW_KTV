import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const ToastNotification: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      className="toast-notification-container animate-fade-in"
      style={{
        bottom: '32px',
        zIndex: 20000,
        borderColor: 'rgba(236, 72, 153, 0.4)',
      }}
    >
      <CheckCircle2 size={20} color="#ec4899" />
      <span>{message}</span>
    </div>
  );
};
