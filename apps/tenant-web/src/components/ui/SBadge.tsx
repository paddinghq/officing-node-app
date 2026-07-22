/**
 * SBadge — status/label badge with semantic colors.
 */
import type { ReactNode } from 'react';

type Color = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

const COLORS: Record<Color, { bg: string; text: string }> = {
  success: { bg: 'rgba(22,163,74,0.12)',  text: '#16a34a' },
  warning: { bg: 'rgba(217,119,6,0.12)',  text: '#d97706' },
  danger:  { bg: 'rgba(220,38,38,0.12)',  text: '#dc2626' },
  info:    { bg: 'rgba(37,99,235,0.12)',  text: '#2563eb' },
  neutral: { bg: 'var(--surface-secondary)', text: 'var(--muted)' },
  brand:   { bg: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)', text: 'var(--brand-primary)' },
};

interface Props {
  children: ReactNode;
  color?: Color;
  className?: string;
}

export function SBadge({ children, color = 'neutral', className = '' }: Props) {
  const c = COLORS[color];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${className}`}
      style={{ background: c.bg, color: c.text }}
    >
      {children}
    </span>
  );
}
