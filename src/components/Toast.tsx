import React from 'react';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
}

const iconMap = {
  success: (
    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const borderColorMap = {
  success: 'border-emerald-500/20',
  error: 'border-red-500/20',
  info: 'border-accent-cyan/20',
};

const Toast: React.FC<ToastProps> = ({ type, message }) => {
  return (
    <div
      className={`glass-strong rounded-xl px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[380px]
                  animate-slide-in-right shadow-xl shadow-black/30 ${borderColorMap[type]}`}
    >
      <div className="shrink-0">{iconMap[type]}</div>
      <p className="text-sm text-surface-200 font-medium">{message}</p>
    </div>
  );
};

export default Toast;
