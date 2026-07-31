import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const ToastNotification: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 24px',
        borderRadius: '30px',
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(236, 72, 153, 0.4)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(236, 72, 153, 0.25)',
        color: '#f8fafc',
        fontSize: '0.92rem',
        fontWeight: 700,
        pointerEvents: 'none',
      }}
    >
      <CheckCircle2 size={20} color="#ec4899" />
      <span>{message}</span>
    </div>
  );
};
