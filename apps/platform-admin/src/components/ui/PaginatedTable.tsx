import { type ReactNode } from 'react';

export interface TableColumn {
  id: string;
  name: string;
}

interface PaginatedTableProps<T extends object> {
  columns: TableColumn[];
  items: T[];
  totalItems: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  renderCell: (item: T, columnId: string) => ReactNode;
  ariaLabel?: string;
}

export function PaginatedTable<T extends object>({
  columns,
  items,
  totalItems,
  page,
  rowsPerPage,
  onPageChange,
  renderCell,
  ariaLabel = 'Table',
}: PaginatedTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const start = (page - 1) * rowsPerPage + 1;
  const end = Math.min(page * rowsPerPage, totalItems);

  return (
    <div>
      {/* Scrollable table wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm" aria-label={ariaLabel}>
          <thead>
            <tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--separator)' }}>
              {columns.map(col => (
                <th
                  key={col.id}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--muted)' }}
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-sm"
                  style={{ color: 'var(--muted)' }}
                >
                  No results found.
                </td>
              </tr>
            )}
            {items.map((item, rowIdx) => (
              <tr
                key={rowIdx}
                style={{ borderBottom: '1px solid var(--separator)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {columns.map(col => (
                  <td key={col.id} className="px-5 py-3.5">
                    {renderCell(item, col.id)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {totalItems > 0 && (
        <div
          className="flex items-center justify-between px-5 py-4 border-t"
          style={{ borderColor: 'var(--separator)' }}
        >
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Showing {start}–{end} of {totalItems} results
          </p>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--surface)',
                color: 'var(--foreground)',
              }}
            >
              Previous
            </button>

            {/* Page numbers — show up to 5 around current */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && (arr[i - 1] as number) + 1 < p) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs" style={{ color: 'var(--muted)' }}>
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      borderColor: p === page ? 'var(--accent)' : 'var(--border)',
                      background: p === page ? 'var(--accent)' : 'var(--surface)',
                      color: p === page ? 'var(--accent-foreground)' : 'var(--foreground)',
                    }}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              disabled={page === totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--surface)',
                color: 'var(--foreground)',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
