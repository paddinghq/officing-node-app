/**
 * SPagination — prev / next + page number strip.
 */
import { ChevronLeft, ChevronRight } from '@gravity-ui/icons';

interface Props {
  page: number;
  hasNextPage: boolean;
  hasPrevPage?: boolean;
  totalDocs: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function SPagination({ page, hasNextPage, hasPrevPage, totalDocs, limit, onPageChange }: Props) {
  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, totalDocs);

  const btnCls = `
    inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors
    disabled:opacity-40 disabled:cursor-not-allowed
  `;
  const btnStyle: React.CSSProperties = {
    background: 'var(--surface)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
  };

  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        {totalDocs === 0 ? 'No results' : `${start}–${end} of ${totalDocs}`}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          className={btnCls}
          style={btnStyle}
          disabled={!hasPrevPage && page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft width={14} height={14} />
          Previous
        </button>
        <button
          className={btnCls}
          style={btnStyle}
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight width={14} height={14} />
        </button>
      </div>
    </div>
  );
}
