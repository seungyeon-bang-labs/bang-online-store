import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight, Eye, Heart, MoreHorizontal, Truck } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MypageDashboardViewModel } from '@/domains/mypage';
import { buildQueryHref } from '@/shared/lib/query';
import { cn } from '@/shared/lib/utils';
import { MypageDashboardProductPreview } from './mypage-dashboard-product-preview';
import { MypageStatusBadge } from './mypage-status-badge';

interface DashboardSummaryItem {
  label: string;
  value: string;
  href: string;
  actionLabel: string;
}

export function MypageDashboard({
  dashboard,
}: {
  dashboard: MypageDashboardViewModel;
}) {
  const summaryItems = [
    {
      label: '회원',
      value: dashboard.summary.memberName + '님',
      href: '/mypage/edit',
      actionLabel: '정보 수정',
    },
    {
      label: '기본 배송지',
      value: dashboard.summary.defaultAddressText,
      href: '/mypage/address',
      actionLabel: '배송지 관리',
    },
    {
      label: '멤버십 등급',
      value: dashboard.summary.membershipTierName,
      href: '/mypage/membership',
      actionLabel: '혜택 보기',
    },
    {
      label: '적립금',
      value: dashboard.summary.pointBalanceText,
      href: '/mypage/points',
      actionLabel: '내역 보기',
    },
    {
      label: '쿠폰',
      value: dashboard.summary.availableCouponCount + '장',
      href: '/mypage/coupons',
      actionLabel: '쿠폰 보기',
    },
  ];

  return (
    <div className="space-y-10 md:space-y-14">
      <DashboardSummary items={summaryItems} />
      <DashboardOrders
        statuses={dashboard.orderStatuses}
        orders={dashboard.recentOrders}
      />

      <section className="space-y-5">
        <SectionTitle
          title="최근 본 상품"
          action={
            <Link
              href="/mypage/recent"
              className="relative text-sm font-black text-zinc-500 underline-offset-4 after:absolute after:-inset-3 hover:text-black hover:underline"
            >
              전체 보기
            </Link>
          }
        />

        {dashboard.recentProducts.length > 0 ? (
          <MypageDashboardProductPreview items={dashboard.recentProducts} />
        ) : (
          <DashboardCompactEmptyState
            title="최근 본 상품이 없습니다."
            description="상품을 둘러보면 이곳에서 다시 확인할 수 있습니다."
            href="/new"
            actionLabel="상품 보러 가기"
          />
        )}
      </section>

      <section className="space-y-5">
        <SectionTitle
          title="관심 상품"
          action={
            <Link
              href="/mypage/wishlist"
              className="relative text-sm font-black text-zinc-500 underline-offset-4 after:absolute after:-inset-3 hover:text-black hover:underline"
            >
              전체 보기
            </Link>
          }
        />

        {dashboard.wishlistProducts.length > 0 ? (
          <MypageDashboardProductPreview items={dashboard.wishlistProducts} />
        ) : (
          <DashboardCompactEmptyState
            title="관심 상품이 없습니다."
            description="관심 있는 상품을 저장하면 이곳에서 확인할 수 있습니다."
            href="/best"
            actionLabel="상품 보러 가기"
          />
        )}
      </section>
    </div>
  );
}

function DashboardSummary({ items }: { items: DashboardSummaryItem[] }) {
  return (
    <section>
      <div className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-200">
        <div className="grid grid-cols-1 gap-px xl:grid-cols-[3fr_5fr]">
          {items.slice(0, 2).map(item => {
            return (
              <div
                key={item.label}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-2 bg-white px-5 py-4"
              >
                <p className="justify-self-start whitespace-nowrap text-sm font-black tracking-[0.04em] text-zinc-500">
                  {item.label}
                </p>
                <p className="line-clamp-2 min-w-0 w-full text-center text-base font-black tracking-tight text-black">
                  {item.value}
                </p>
                <ButtonLink
                  href={item.href}
                  variant="outline"
                  size="xs"
                  className="justify-self-end rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
                >
                  {item.actionLabel}
                </ButtonLink>
              </div>
            );
          })}
        </div>

        <div className="mt-px grid grid-cols-1 gap-px xl:grid-cols-[3fr_3fr_2fr]">
          {items.slice(2).map(item => {
            return (
              <div
                key={item.label}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-2 bg-white px-5 py-4"
              >
                <p className="justify-self-start whitespace-nowrap text-sm font-black tracking-[0.04em] text-zinc-500">
                  {item.label}
                </p>
                <p className="line-clamp-2 min-w-0 w-full text-center text-base font-black tracking-tight text-black">
                  {item.value}
                </p>
                <ButtonLink
                  href={item.href}
                  variant="outline"
                  size="xs"
                  className="justify-self-end rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
                >
                  {item.actionLabel}
                </ButtonLink>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DashboardOrders({
  statuses,
  orders,
}: {
  statuses: MypageDashboardViewModel['orderStatuses'];
  orders: MypageDashboardViewModel['recentOrders'];
}) {
  return (
    <section className="space-y-5">
      <SectionTitle
        title="최근 주문/배송"
        action={
          <Link
            href={buildQueryHref('/mypage/orders', {
              period: '3-months',
              status: 'all',
              page: 1,
            })}
            className="relative text-sm font-black text-zinc-500 underline-offset-4 after:absolute after:-inset-3 hover:text-black hover:underline"
          >
            전체 보기
          </Link>
        }
      />

      <DashboardOrderStatuses items={statuses} />
      <DashboardRecentOrders orders={orders} />
    </section>
  );
}

function DashboardOrderStatuses({
  items,
}: {
  items: MypageDashboardViewModel['orderStatuses'];
}) {
  return (
    <nav aria-label="최근 3개월 주문 상태" className="relative">
      <ul className="flex snap-x snap-mandatory overflow-x-auto rounded-md border border-zinc-200 bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:overflow-visible">
        {items.map(status => (
          <li
            key={status.status}
            className="min-w-[6.5rem] shrink-0 snap-start border-r border-zinc-200 last:border-r-0 lg:min-w-0"
          >
            <Link
              href={buildQueryHref('/mypage/orders', {
                period: '3-months',
                status: status.status,
                page: 1,
              })}
              aria-label={`${status.label} 주문 ${status.count}건 보기`}
              className="group flex h-24 flex-col items-center justify-center px-2 text-center outline-none transition-colors hover:bg-black focus-visible:bg-black"
            >
              <p
                className={cn(
                  'text-2xl font-black transition-colors group-hover:text-white group-focus-visible:text-white',
                  status.count > 0 ? 'text-black' : 'text-zinc-300',
                )}
              >
                {status.count}
              </p>
              <p className="mt-2 whitespace-nowrap text-sm font-bold text-zinc-500 transition-colors group-hover:text-white group-focus-visible:text-white">
                {status.label}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-px right-px z-10 flex w-10 items-center justify-end rounded-r-md bg-gradient-to-l from-white via-white/90 to-transparent pr-1 lg:hidden"
      >
        <ChevronRight className="size-4 text-zinc-500" />
      </div>
    </nav>
  );
}

function DashboardRecentOrders({
  orders,
}: {
  orders: MypageDashboardViewModel['recentOrders'];
}) {
  if (orders.length === 0) {
    return (
      <DashboardCompactEmptyState
        title="최근 주문이 없습니다."
        description="상품을 주문하면 배송 상태와 주문 내역을 확인할 수 있습니다."
        href="/new"
        actionLabel="상품 보러 가기"
      />
    );
  }

  return (
    <div className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
      {orders.map(order => {
        const firstItem = order.items[0];
        const title = firstItem
          ? firstItem.productName +
            (order.items.length > 1
              ? ' 외 ' + (order.items.length - 1) + '건'
              : '')
          : '주문 상품 정보 없음';
        const orderHref = [
          order.actions.primary,
          order.actions.secondary,
          ...order.actions.more,
        ].find(action => action?.type === 'order')?.href;

        return (
          <article
            key={order.id}
            className="grid gap-3 p-3 transition-colors hover:bg-zinc-50 lg:grid-cols-[5.5rem_minmax(0,1fr)_13rem] lg:items-center lg:gap-5"
          >
            <div className="flex items-center lg:justify-center">
              <MypageStatusBadge {...order.status} />
            </div>

            <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[4rem_minmax(0,1fr)_auto] lg:gap-4">
              {firstItem ? (
                <Link
                  href={orderHref ?? '/mypage/orders'}
                  className="relative aspect-square overflow-hidden rounded-sm bg-zinc-100 outline-none ring-black focus-visible:ring-2"
                  aria-label={`${title} 주문 조회`}
                >
                  <Image
                    src={firstItem.product.thumbnailUrl}
                    alt={firstItem.productName}
                    fill
                    sizes="(max-width: 1023px) 56px, 64px"
                    className="object-cover"
                  />
                </Link>
              ) : (
                <div className="aspect-square rounded-sm bg-zinc-100" />
              )}

              <div className="min-w-0">
                <Link
                  href={orderHref ?? '/mypage/orders'}
                  className="line-clamp-2 min-w-0 text-sm font-black text-black outline-none hover:underline focus-visible:underline"
                >
                  {title}
                </Link>
                <p className="mt-1.5 text-xs font-bold text-zinc-500">
                  {order.orderedAt}
                </p>
              </div>

              <p className="justify-self-end whitespace-nowrap text-sm font-black tabular-nums text-black">
                {order.totalAmountText}
              </p>
            </div>

            <div className="flex justify-end lg:w-52">
              <DashboardOrderActions actions={order.actions} title={title} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function DashboardOrderActions({
  actions,
  title,
}: {
  actions: MypageDashboardViewModel['recentOrders'][number]['actions'];
  title: string;
}) {
  const hasMenu = actions.more.length > 0;

  return (
    <div className="flex items-center gap-2">
      {actions.primary && (
        <ButtonLink
          href={actions.primary.href}
          variant="outline"
          size="default"
          className="h-9 rounded-sm border-zinc-300 bg-white px-3 text-xs font-black text-black shadow-none hover:border-black hover:bg-black hover:text-white"
        >
          {actions.primary.label}
        </ButtonLink>
      )}
      {actions.secondary && (
        <ButtonLink
          href={actions.secondary.href}
          variant="outline"
          size="default"
          className="h-9 rounded-sm border-zinc-300 bg-white px-3 text-xs font-black text-black shadow-none hover:border-black hover:bg-black hover:text-white"
        >
          {actions.secondary.label}
        </ButtonLink>
      )}
      {hasMenu && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 rounded-sm border-zinc-300 shadow-none hover:border-black hover:bg-black hover:text-white"
              aria-label={`${title} 추가 행동`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            {actions.more.map(action => (
              <DropdownMenuItem
                key={action.type}
                asChild
                className="cursor-pointer focus:bg-black focus:text-white"
              >
                <Link href={action.href}>{action.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function DashboardCompactEmptyState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-white px-5 py-7 text-center">
      <p className="text-sm font-black text-black">{title}</p>
      <p className="mt-1.5 text-xs font-medium leading-relaxed text-zinc-500">
        {description}
      </p>
      <ButtonLink
        href={href}
        variant="outline"
        size="xs"
        className="mt-4 rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
      >
        {actionLabel}
      </ButtonLink>
    </div>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-zinc-200 pb-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-black">
          {title === '최근 주문/배송' && <Truck className="size-4" />}
          {title === '최근 본 상품' && <Eye className="size-4" />}
          {title === '관심 상품' && <Heart className="size-4" />}
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
