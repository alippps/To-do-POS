'use client';

import { useEffect } from 'react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => onClose(), 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const ok = toast.ok;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-fade-up sm:left-auto sm:right-6 sm:translate-x-0">
      <div
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-pop ${
          ok ? 'border-emerald-100 bg-emerald-50' : 'border-rose-100 bg-rose-50'
        }`}
      >
        <span className={`text-lg ${ok ? 'text-emerald-600' : 'text-rose-600'}`}>{ok ? '✓' : '!'}</span>
        <p className={`flex-1 text-sm font-medium ${ok ? 'text-emerald-800' : 'text-rose-800'}`}>
          {toast.message}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi"
          className="text-slate-400 transition hover:text-slate-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
