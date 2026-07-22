/**
 * PageShell — consistent page wrapper with title, subtitle, and action slot.
 */
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

export function PageShell({ title, subtitle, actions, children, maxWidth = 'max-w-7xl' }: Props) {
  return (
    <div className={`p-5 sm:p-7 space-y-6 ${maxWidth} w-full`}>
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {/* Page body */}
      {children}
    </div>
  );
}
