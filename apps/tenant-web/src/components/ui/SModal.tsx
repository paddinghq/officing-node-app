/**
 * SModal — accessible modal using HeroUI ModalRoot primitives.
 * Falls back to a clean custom implementation using CSS vars.
 */
import { useEffect, type ReactNode } from 'react';
import { Xmark } from '@gravity-ui/icons';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

export function SModal({ open, onClose, title, children, size = 'md', footer }: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative w-full ${SIZES[size]} max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden`}
        style={{ background: 'var(--overlay)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--separator)' }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 transition-colors"
              style={{ color: 'var(--muted)' }}
              aria-label="Close"
            >
              <Xmark width={17} height={17} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className="shrink-0 px-6 py-4"
            style={{ borderTop: '1px solid var(--separator)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
