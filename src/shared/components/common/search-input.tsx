'use client';

import { type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { IconInput } from '@/shared/components/common/icon-input';

interface SearchInputProps {
  getPageHref?: (params: { q: string }) => string;
  initialValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  size?: 'lg' | 'xl';
}

export function SearchInput({
  initialValue = '',
  getPageHref,
  placeholder = '검색어를 입력하세요',
  autoFocus = false,
  className,
  inputClassName,
  size = 'lg',
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('q')?.toString().trim();
    const resolvedQuery = query || '';

    if (getPageHref) {
      router.push(getPageHref({ q: resolvedQuery }));
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (resolvedQuery) {
      params.set('q', resolvedQuery);
    } else {
      params.delete('q');
    }

    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className={className ?? 'relative w-full md:w-80'}>
      <IconInput
        name="q" // 서버 액션이나 FormData에서 인식할 키값
        defaultValue={initialValue}
        placeholder={placeholder}
        icon={Search}
        size={size}
        className={inputClassName}
        autoFocus={autoFocus}
      />
      {/* 별도의 버튼 없이 엔터만으로 onSubmit이 실행됩니다. */}
    </form>
  );
}
