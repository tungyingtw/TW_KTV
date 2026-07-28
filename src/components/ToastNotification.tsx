import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const ToastNotification: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(236, 72, 153, 0.4)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(236, 72, 153, 0.3)',
        padding: '12px 22px',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#fff',
        fontWeight: 600,
        fontSize: '0.95rem',
        backdropFilter: 'blur(12px)',
        pointerEvents: 'none',
      }}
      className="animate-fade-in"
    >
      <CheckCircle2 size={20} color="#ec4899" />
      <span>{message}</span>
    </div>
  );
};
