/**
 * DataTable — responsive table with loading skeleton, empty state, and pagination.
 */
import { Skeleton } from '@heroui/react';
import { SPagination } from './SPagination';
import type { ReactNode } from 'react';

export interface Col {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
}

interface Props<T extends { _id: string }> {
  columns: Col[];
  rows: T[];
  renderCell: (row: T, key: string) => ReactNode;
  isLoading?: boolean;
  page?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  totalDocs?: number;
  limit?: number;
  onPageChange?: (p: number) => void;
  emptyMessage?: string;
}

const TH_CLS = 'px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider';
const TD_CLS = 'px-5 py-3.5 text-sm';

export function DataTable<T extends { _id: string }>({
  columns, rows, renderCell, isLoading,
  page, hasNextPage, hasPrevPage, totalDocs, limit, onPageChange,
  emptyMessage = 'No results found.',
}: Props<T>) {
  const showPagination = page != null && onPageChange != null && totalDocs != null && limit != null;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border-collapse">
          <thead>
            <tr style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--separator)' }}>
              {columns.map(c => (
                <th
                  key={c.key}
                  className={TH_CLS}
                  style={{ color: 'var(--muted)', textAlign: c.align ?? 'left' }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--separator)' }}>
                  {columns.map(c => (
                    <td key={c.key} className={TD_CLS}>
                      <Skeleton className="h-4 w-full rounded-lg" />
                    </td>
                  ))}
                </tr>
              ))
            )}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-sm"
                  style={{ color: 'var(--muted)' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!isLoading && rows.map((row, ri) => (
              <tr
                key={row._id}
                style={{
                  borderBottom: ri < rows.length - 1 ? '1px solid var(--separator)' : 'none',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {columns.map(c => (
                  <td key={c.key} className={TD_CLS} style={{ textAlign: c.align ?? 'left' }}>
                    {renderCell(row, c.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="px-5" style={{ borderTop: '1px solid var(--separator)' }}>
          <SPagination
            page={page!}
            hasNextPage={hasNextPage!}
            hasPrevPage={hasPrevPage}
            totalDocs={totalDocs!}
            limit={limit!}
            onPageChange={onPageChange!}
          />
        </div>
      )}
    </div>
  );
}
