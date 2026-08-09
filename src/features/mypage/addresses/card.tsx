import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserAddressViewModel } from '@/domains/member';
import { MoreVertical } from 'lucide-react';

interface MypageAddressCardProps {
  address: UserAddressViewModel;
}

export function MypageAddressCard({ address }: MypageAddressCardProps) {
  return (
    <article className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 p-4 md:p-5">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-base font-black text-black">
            {address.displayName}
          </h3>
          {address.isDefault && (
            <span className="shrink-0 rounded-sm bg-black px-2 py-1 text-xs font-black text-white">
              기본 배송지
            </span>
          )}
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            aria-label="배송지 관리 메뉴"
            className="flex size-10 shrink-0 items-center justify-center rounded-sm text-zinc-700 outline-none transition-colors hover:bg-zinc-100 hover:text-black focus-visible:bg-zinc-100 focus-visible:text-black md:hidden"
          >
            <MoreVertical className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-36">
            {!address.isDefault && (
              <DropdownMenuItem className="h-11 justify-center text-center font-bold whitespace-nowrap">
                기본 배송지로 설정
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="h-11 justify-center text-center font-bold whitespace-nowrap">
              수정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="h-11 justify-center text-center font-bold whitespace-nowrap"
            >
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {!address.isDefault && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden shrink-0 border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white md:inline-flex"
          >
            기본 배송지로 설정
          </Button>
        )}
      </header>

      <div className="p-4 md:p-5">
        <p className="text-sm font-bold leading-relaxed text-black">
          {address.formattedAddress}
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-500">
          우편번호 {address.postalCode}
        </p>
        <p className="mt-2 text-sm font-medium text-zinc-700">
          {address.recipientName} · {address.phoneNumber}
        </p>
        {address.deliveryNote && (
          <p className="mt-2 text-sm font-medium text-zinc-500">
            배송 메모 · {address.deliveryNote}
          </p>
        )}
        <div className="mt-4 hidden grid-cols-2 gap-2 md:grid">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-sm border-red-200 font-bold text-red-700 shadow-none hover:border-red-600 hover:bg-red-50 hover:text-red-700"
          >
            삭제
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
          >
            수정
          </Button>
        </div>
      </div>
    </article>
  );
}
