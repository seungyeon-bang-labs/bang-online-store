import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getProductDiscount } from '@/domains/discount';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCombinedHref = <
  T extends Record<string, string | number | boolean | undefined | null>,
>(
  currentParams: T,
  newParams: Partial<T>,
  options: { omitValues?: unknown[] } = {
    omitValues: ['all', '', undefined, null],
  },
): string => {
  const params = new URLSearchParams();

  const combined: T = { ...currentParams, ...newParams };

  (Object.keys(combined) as Array<keyof T>).forEach(key => {
    const value = combined[key];

    if (!options.omitValues?.includes(value)) {
      params.set(String(key), String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export { getProductDiscount };
