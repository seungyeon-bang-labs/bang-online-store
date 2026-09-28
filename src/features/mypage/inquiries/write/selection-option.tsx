import Image from 'next/image';
import type { ReactNode } from 'react';

interface MypageInquirySelectionOptionProps {
  children?: ReactNode;
  onSelect: () => void;
  thumbnailUrl: string | null;
  title: string;
  trailing?: ReactNode;
}

export function MypageInquirySelectionOption({
  children,
  onSelect,
  thumbnailUrl,
  title,
  trailing,
}: MypageInquirySelectionOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 py-3 text-left hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-zinc-100">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt=""
            fill
            sizes="56px"
            className="object-cover object-center"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-black">{title}</p>
        {children}
      </div>
      {trailing}
    </button>
  );
}
