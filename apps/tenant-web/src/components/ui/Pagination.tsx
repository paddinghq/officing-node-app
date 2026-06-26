import React from 'react';
import { Button } from './Button';

interface Props {
  page: number;
  hasNextPage: boolean;
  hasPrevPage?: boolean;
  totalDocs: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, hasNextPage, hasPrevPage, totalDocs, limit, onPageChange }: Props) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalDocs);

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-600">
        Showing {start}–{end} of {totalDocs}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={!hasPrevPage && page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
