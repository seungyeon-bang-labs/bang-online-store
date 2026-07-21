export interface PageSlice<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export function paginate<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize: number,
): PageSlice<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage =
    requestedPage >= 1 && requestedPage <= totalPages ? requestedPage : 1;
  const offset = (currentPage - 1) * pageSize;

  return {
    items: items.slice(offset, offset + pageSize),
    currentPage,
    totalPages,
    totalItems,
  };
}
