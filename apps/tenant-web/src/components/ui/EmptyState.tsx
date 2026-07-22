/**
 * EmptyState — used when a section/page has no data or access is restricted.
 */
import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div
      className="rounded-2xl border p-10 sm:p-14 flex flex-col items-center text-center gap-3"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {icon && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)',
            color: 'var(--brand-primary)',
          }}
        >
          {icon}
        </div>
      )}
      <p
        className="text-base font-semibold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
      >
        {title}
      </p>
      {description && (
        <p className="text-sm max-w-xs" style={{ color: 'var(--muted)' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
