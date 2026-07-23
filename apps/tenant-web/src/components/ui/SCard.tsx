/**
 * SCard — surface card with optional title + actions header.
 */
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SCard({ children, title, actions, className = '', noPadding }: Props) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden ${className}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {(title || actions) && (
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--separator)' }}
        >
          {title && (
            <h3
              className="text-base font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              {title}
            </h3>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
