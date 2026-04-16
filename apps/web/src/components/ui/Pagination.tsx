import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  total: number;
  limit: number;
  params: Record<string, string>;
}

export function Pagination({ currentPage, hasNextPage, total, limit, params }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const p = new URLSearchParams(params);
    p.set('page', String(page));
    return `/listings?${p.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      {currentPage > 1 && (
        <Link href={buildUrl(currentPage - 1)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          ← Əvvəlki
        </Link>
      )}

      <span className="text-sm text-gray-600">
        {currentPage} / {totalPages}
      </span>

      {hasNextPage && (
        <Link href={buildUrl(currentPage + 1)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          Növbəti →
        </Link>
      )}
    </div>
  );
}
