export function Input({ label, hint, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="label-base">{label}</span>}
      <input className={`input-base ${error ? 'border-rose-300 focus:ring-rose-100' : ''} ${className}`} {...props} />
      {hint && !error && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function Textarea({ label, hint, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="label-base">{label}</span>}
      <textarea
        className={`input-base min-h-[120px] resize-y ${error ? 'border-rose-300' : ''} ${className}`}
        {...props}
      />
      {hint && !error && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function Select({ label, hint, error, children, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="label-base">{label}</span>}
      <select
        className={`input-base cursor-pointer ${error ? 'border-rose-300 focus:ring-rose-100' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
