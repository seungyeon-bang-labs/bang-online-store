import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/shared/components/ui/pagination';

type PaginationRangeItem = number | '...';

function getPaginationRange(currentPage: number, totalPages: number) {
  if (totalPages <= 0) return [];

  const delta = 2;
  const range: number[] = [];
  const rangeWithDots: PaginationRangeItem[] = [];

  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i);
  }

  range.unshift(1);
  if (totalPages > 1) range.push(totalPages);

  let prev: number | null = null;

  for (const i of range) {
    if (prev !== null) {
      if (i - prev === 2) {
        rangeWithDots.push(prev + 1);
      } else if (i - prev > 2) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    prev = i;
  }

  return rangeWithDots;
}

interface DynamicPaginationProps {
  currentPage: number;
  totalPages: number;
  getPageHref: (params: { page: number }) => string;
}

export function DynamicPagination({
  currentPage,
  totalPages,
  getPageHref,
}: DynamicPaginationProps) {
  const paginationRange = getPaginationRange(currentPage, totalPages);

  if (totalPages < 1) return null;

  return (
    <Pagination>
      <PaginationContent className="gap-1 md:gap-2">
        <PaginationItem>
          <PaginationPrevious
            href={getPageHref({ page: Math.max(currentPage - 1, 1) })}
            className={currentPage === 1 ? 'invisible pointer-events-none' : ''}
          />
        </PaginationItem>

        {paginationRange.map((pageNumber, index) => (
          <PaginationItem key={index}>
            {pageNumber === '...' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href={getPageHref({ page: pageNumber })}
                isActive={pageNumber === currentPage}
              >
                {pageNumber}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href={getPageHref({
              page: Math.min(currentPage + 1, totalPages),
            })}
            className={
              currentPage === totalPages ? 'invisible pointer-events-none' : ''
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
