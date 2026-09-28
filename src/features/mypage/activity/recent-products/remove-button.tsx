'use client';

import { X } from 'lucide-react';
import { toast } from 'sonner';

interface MypageRecentProductRemoveButtonProps {
  productName: string;
}

export function MypageRecentProductRemoveButton({
  productName,
}: MypageRecentProductRemoveButtonProps) {
  return (
    <button
      type="button"
      aria-label={`${productName} 최근 본 상품에서 제거`}
      onClick={() =>
        toast.success('최근 본 상품에서 삭제했습니다.', {
          position: 'bottom-center',
        })
      }
      className="inline-flex size-6 items-center justify-center rounded-sm text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:size-7"
    >
      <X className="size-5" aria-hidden="true" />
    </button>
  );
}
