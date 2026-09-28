'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { MYPAGE_INPUT_CLASS_NAME } from '@/features/mypage/common/styles';

interface MypageInquirySelectorSearchInputProps {
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
}

export function MypageInquirySelectorSearchInput({
  value,
  placeholder,
  onValueChange,
}: MypageInquirySelectorSearchInputProps) {
  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500"
        strokeWidth={2}
      />
      <Input
        value={value}
        onChange={event => onValueChange(event.target.value)}
        placeholder={placeholder}
        className={`${MYPAGE_INPUT_CLASS_NAME} pl-10 ${value ? 'pr-10' : 'pr-3'
          }`}
        autoFocus
      />
      {value ? (
        <button
          type="button"
          onClick={() => onValueChange('')}
          aria-label="검색어 지우기"
          className="absolute top-1/2 right-0 flex size-10 -translate-y-1/2 items-center justify-center text-zinc-500 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}
