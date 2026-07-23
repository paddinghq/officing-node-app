/**
 * Field — styled input / select / textarea wrapper.
 * Forwards all native props. Focus ring uses --brand-primary.
 */
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

// ─── Shared label/help ────────────────────────────────────────────────────────
function FieldLabel({ label, required }: { label?: string; required?: boolean }) {
  if (!label) return null;
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>
      {label}
      {required && <span className="ml-0.5" style={{ color: 'var(--danger)' }}>*</span>}
    </label>
  );
}

function FieldHelp({ text, error }: { text?: string; error?: string }) {
  if (error) return <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>{error}</p>;
  if (text)  return <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{text}</p>;
  return null;
}

const INPUT_CLS = `
  w-full rounded-xl border px-3 py-2.5 text-sm transition-colors outline-none
  focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-[var(--brand-primary)]
  disabled:cursor-not-allowed disabled:opacity-80
`;

// Helper to handle inline style overrides based on disabled state
function getFieldStyle(disabled?: boolean, customStyle?: React.CSSProperties): React.CSSProperties {
  return {
    background: disabled ? 'var(--surface-secondary, #f3f4f6)' : 'var(--field-background)',
    borderColor: 'var(--field-border)',
    color: disabled ? 'var(--muted, #6b7280)' : 'var(--field-foreground)',
    ...customStyle,
  };
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  startIcon?: ReactNode;
}
export function Field({ label, error, helpText, startIcon, className = '', style, ...props }: InputProps) {
  return (
    <div className="flex flex-col">
      <FieldLabel label={label} required={props.required} />
      <div className="relative">
        {startIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}>
            {startIcon}
          </span>
        )}
        <input
          {...props}
          className={`${INPUT_CLS} ${startIcon ? 'pl-9' : ''} ${error ? 'border-[var(--danger)]' : ''} ${className}`}
          style={getFieldStyle(props.disabled, style)}
        />
      </div>
      <FieldHelp text={helpText} error={error} />
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}
Field.Select = function FieldSelect({ label, error, options, className = '', style, ...props }: SelectProps) {
  return (
    <div className="flex flex-col">
      <FieldLabel label={label} required={props.required} />
      <select
        {...props}
        className={`${INPUT_CLS} ${error ? 'border-[var(--danger)]' : ''} ${className}`}
        style={getFieldStyle(props.disabled, style)}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <FieldHelp error={error} />
    </div>
  );
};

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}
Field.Textarea = function FieldTextarea({ label, error, helpText, className = '', style, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col">
      <FieldLabel label={label} required={props.required} />
      <textarea
        {...props}
        className={`${INPUT_CLS} resize-y min-h-[80px] ${error ? 'border-[var(--danger)]' : ''} ${className}`}
        style={getFieldStyle(props.disabled, style)}
      />
      <FieldHelp text={helpText} error={error} />
    </div>
  );
};