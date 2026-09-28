import { MypageHomeMembershipSummary } from './membership-summary';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import type { MypageHomeSummaryViewModel } from '@/domains/mypage';
import { ButtonLink } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import {
  MYPAGE_HOME_SUMMARY_ROWS,
  type MypageHomeSummaryItemId,
  type MypageHomeSummaryMenuItem,
} from './summary-menu';

interface MypageHomeSummaryProps {
  summary: MypageHomeSummaryViewModel;
}

export function MypageHomeSummary({ summary }: MypageHomeSummaryProps) {
  const valueByItemId: Record<MypageHomeSummaryItemId, string> = {
    member: summary.memberName + '님',
    address: summary.defaultAddressText,
    membership: summary.membershipTierName,
    points: summary.pointBalanceText,
    coupons: summary.availableCouponCount + '장',
  };

  return (
    <section aria-label="회원 정보 요약">
      <div className="-mx-4 overflow-hidden border-y border-zinc-300 bg-white md:hidden">
        <div className="px-4 pt-2 pb-3">
          <div className="flex flex-col items-start gap-1 pb-2">
            <div className="flex min-h-14 w-full items-center justify-between gap-3 py-2">
              <span className="line-clamp-2 min-w-0 flex-1 break-words pl-3 text-lg font-bold leading-6 tracking-tight text-black">
                {summary.memberName}
                <span className="ml-0.5 text-sm font-normal text-zinc-600">님</span>
              </span>
              <ButtonLink href="/mypage/edit" variant="outline" size="sm" className="shrink-0 text-xs md:text-sm">
                정보 수정
              </ButtonLink>
            </div>
            <MypageHomeMembershipSummary
              tierName={summary.membershipTierName}
              tierCode={summary.membershipTierCode}
              progress={summary.membershipProgress}
            />
          </div>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {MYPAGE_HOME_SUMMARY_ROWS[1].filter(item => item.id !== 'membership').map(item => (
              <MypageHomeSummaryQuickLink
                key={item.id}
                item={item}
                value={valueByItemId[item.id]}
              />
            ))}
          </div>
        </div>
        <MypageHomeAddressLink
          address={valueByItemId.address}
          className="mx-4 mb-3"
        />
      </div>
      <div className="hidden rounded-md border border-zinc-300 bg-white p-5 md:block">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <p className="min-w-0 truncate pl-3 text-lg font-bold tracking-tight text-black md:text-xl">
            {summary.memberName}
            <span className="ml-0.5 text-sm font-normal text-zinc-600">님</span>
          </p>
          <ButtonLink href="/mypage/edit" variant="outline" size="sm" className="shrink-0 text-xs md:text-sm">
            정보 수정
          </ButtonLink>
        </div>
        <div className="mt-3 grid grid-cols-2 items-stretch gap-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="col-span-2 lg:col-span-1">
            <MypageHomeMembershipSummary
              tierName={summary.membershipTierName}
              tierCode={summary.membershipTierCode}
              progress={summary.membershipProgress}
            />
          </div>
          {MYPAGE_HOME_SUMMARY_ROWS[1].filter(item => item.id !== 'membership').map(item => (
            <MypageHomeSummaryQuickLink
              key={item.id}
              item={item}
              value={valueByItemId[item.id]}
              className="h-full p-4"
            />
          ))}
        </div>
        <MypageHomeAddressLink
          address={valueByItemId.address}
          label="기본 배송지"
          emphasizeAddress
          className="mt-2 p-4"
        />
      </div>
    </section>
  );
}

interface MypageHomeSummaryQuickLinkProps {
  item: MypageHomeSummaryMenuItem;
  value: string;
  className?: string;
}

function MypageHomeSummaryQuickLink({
  item,
  value,
  className,
}: MypageHomeSummaryQuickLinkProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex min-w-0 flex-col gap-1.5 rounded-md bg-zinc-100 p-3 text-left transition-colors hover:bg-zinc-200 active:bg-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
        className,
      )}
    >
      <span className="text-xs font-medium text-zinc-600 md:text-sm">{item.label}</span>
      <span className="min-w-0 break-words pr-5 text-base font-bold leading-6 tracking-tight tabular-nums text-black md:text-lg">
        {value}
      </span>
      <ChevronRight className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
    </Link>
  );
}

interface MypageHomeAddressLinkProps {
  address: string;
  label?: string;
  emphasizeAddress?: boolean;
  className?: string;
}

function MypageHomeAddressLink({
  address,
  label,
  emphasizeAddress = false,
  className,
}: MypageHomeAddressLinkProps) {
  return (
    <Link
      href="/mypage/address"
      aria-label={`배송지 관리: ${address}`}
      className={cn(
        'relative flex min-h-11 items-center gap-2 rounded-md bg-zinc-100 py-3 pl-3 pr-10 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 active:bg-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black md:text-base',
        className,
      )}
    >
      <MapPin className="size-4 shrink-0 text-zinc-500" strokeWidth={1.75} aria-hidden="true" />
      {label ? <span className="shrink-0 text-xs font-medium text-zinc-500 md:text-sm">{label}</span> : null}
      <span className={cn('min-w-0 flex-1 truncate', emphasizeAddress && 'font-semibold text-black')}>
        {address}
      </span>
      <ChevronRight className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
    </Link>
  );
}
