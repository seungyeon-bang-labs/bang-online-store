'use client';

import { useRouter } from 'next/navigation';
import { Checkbox } from '@/shared/components/ui/checkbox';

interface MypageOrderPartialCancellationToggleProps {
  checked: boolean;
  href: string;
}

export function MypageOrderPartialCancellationToggle({
  checked,
  href,
}: MypageOrderPartialCancellationToggleProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id="include-partial-cancellation"
        checked={checked}
        onCheckedChange={() => router.push(href)}
        className="rounded-sm"
      />
      <label
        htmlFor="include-partial-cancellation"
        className="cursor-pointer text-sm font-medium text-zinc-700"
      >
        주문한 상품 중 취소한 상품이 있는 주문도 보기
      </label>
    </div>
  );
}
