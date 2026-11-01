'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronUp, CreditCard } from 'lucide-react';
import type { CheckoutViewModel } from '@/domains/order/checkout.service';
import {
  getOrderBlock,
  type PlaceOrderInput,
  type PlaceOrderResult,
} from '@/domains/order/place-order';
import type { UserAddressCreateInput } from '@/domains/member';
import { useCartCommands } from '@/features/cart/use-cart';
import { MypageAddressForm } from '@/features/mypage/addresses';
import { ProductPrice } from '@/features/product/product-price';
import { PageTitle } from '@/shared/components/common/page-title';
import { Container } from '@/shared/components/layout/container';
import { Button } from '@/shared/components/ui/button';
import { getCartHref } from '@/shared/lib/cart-routes';
import { formatKoreanMoney } from '@/shared/lib/format';
import { getMypageOrderDetailHref } from '@/shared/lib/mypage-routes';
import { cn } from '@/shared/lib/utils';
import { getOrderBlockMessage, getPlaceOrderMessage } from './checkout-messages';

interface CheckoutPageClientProps {
  checkout: CheckoutViewModel;
  // Made once per server render, so a resent payment replays the same order instead of placing another.
  requestId: string;
  placeOrder(input: Omit<PlaceOrderInput, 'userId'>): Promise<PlaceOrderResult>;
  createAddress(input: UserAddressCreateInput): Promise<boolean>;
  updateAddress(addressId: string, input: UserAddressCreateInput): Promise<boolean>;
}

export function CheckoutPageClient({
  checkout,
  requestId,
  placeOrder,
  createAddress,
  updateAddress,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const { enterCart } = useCartCommands();
  const [isPlacing, setIsPlacing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { items, amounts, address } = checkout;
  const isAddressReady = address.status === 'ready';
  // place_order would refuse these anyway; stop them here so the member is not told to retry.
  const block = getOrderBlock({ lineCount: items.length, totalAmount: amounts.totalAmount });
  const canPay = isAddressReady && block === null;

  async function handlePlaceOrder() {
    if (isPlacing || block !== null || address.status !== 'ready') return;

    setIsPlacing(true);
    setMessage(null);
    let result: PlaceOrderResult;
    try {
      result = await placeOrder({
        requestId,
        cartItemIds: items.map(item => item.id),
        addressId: address.address.id,
        expectedTotal: amounts.totalAmount,
      });
    } catch {
      result = { status: 'rejected', reason: 'failed' };
    }

    if (result.status === 'placed') {
      // The ordered lines left the cart on the server; read it again so the header count follows.
      enterCart();
      router.replace(getMypageOrderDetailHref(result.orderId));
      return;
    }

    setMessage(getPlaceOrderMessage(result));
    setIsPlacing(false);
    // A failure may have placed the order after all; keep this page and its request id so a retry replays it.
    if (result.reason !== 'failed') router.refresh();
  }

  const payLabel = isPlacing
    ? '결제하는 중'
    : `${formatKoreanMoney(amounts.totalAmount)} 결제하기`;
  // Shared by the desktop panel and the mobile bar; only one of them is displayed.
  const renderMessage = () =>
    message && (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
        {message}
      </p>
    );
  const renderPayHint = (className: string) =>
    !canPay && (
      <p className={cn('text-center text-xs', className)}>
        {block !== null ? getOrderBlockMessage(block) : '배송지를 입력하면 결제할 수 있습니다.'}
      </p>
    );
  // Same rows as the cart summary; weight and label color come from the caller.
  const renderDetails = (labelClassName: string) => (
    <>
      <AmountRow labelClassName={labelClassName} label="상품수" value={`${amounts.itemCount}개`} />
      <AmountRow labelClassName={labelClassName} label="상품 금액" value={formatKoreanMoney(amounts.productAmount)} />
      <AmountRow
        labelClassName={labelClassName}
        label="상품 할인"
        value={amounts.discountAmount > 0 ? `-${formatKoreanMoney(amounts.discountAmount)}` : '0원'}
        valueClassName={amounts.discountAmount > 0 ? 'text-red-500' : undefined}
      />
      <AmountRow labelClassName={labelClassName} label="옵션 추가 금액" value={formatKoreanMoney(amounts.optionAmount)} />
      <AmountRow
        labelClassName={labelClassName}
        label="배송비"
        value={amounts.shippingFee > 0 ? formatKoreanMoney(amounts.shippingFee) : '무료 배송'}
      />
    </>
  );

  return (
    <Container className="mb-20 pb-6 tabular-nums md:py-10">
      <PageTitle
        current="주문/결제"
        className="mb-6 hidden border-b-2 pb-4 md:mb-12 md:flex md:border-b-4 md:pb-5"
      >
        <ol aria-label="주문 단계" className="flex items-center gap-2 text-sm font-black text-gray-300">
          <li>01. 장바구니</li>
          <li aria-hidden="true" className="mx-2">{'>'}</li>
          <li aria-current="step" className="text-black">02. 주문/결제</li>
          <li aria-hidden="true" className="mx-2">{'>'}</li>
          <li>03. 주문완료</li>
        </ol>
      </PageTitle>

      <div className="grid items-start gap-6 pt-4 pb-32 md:pt-0 lg:grid-cols-[1fr_360px] lg:gap-12 lg:pb-0">
        <div className="space-y-4 md:space-y-6">
          <section aria-labelledby="checkout-address-title" className={address.status === 'ready' ? CARD : 'space-y-4'}>
            {address.status === 'ready' ? (
              <>
                <SectionHeading id="checkout-address-title" aside="기본 배송지">배송지</SectionHeading>
                <div className="space-y-1 text-sm leading-relaxed text-black">
                  <p className="font-black">
                    {address.address.recipientName}
                    {address.label && (
                      <span className="ml-2 rounded-sm border border-black px-1.5 py-px align-middle text-xs font-bold">
                        {address.label}
                      </span>
                    )}
                  </p>
                  <p>{address.address.phoneNumber}</p>
                  <p>
                    [{address.address.postalCode}] {address.address.formattedAddress}
                  </p>
                  {address.address.deliveryNote && (
                    <p className="text-gray-500">{address.address.deliveryNote}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className={CARD}>
                  <SectionHeading id="checkout-address-title">배송지</SectionHeading>
                  <p className="text-sm text-gray-600">
                    {address.status === 'missing'
                      ? '등록된 배송지가 없습니다. 배송지를 등록하면 바로 결제할 수 있습니다.'
                      : '기본 배송지의 상세 주소가 비어 있습니다. 상세 주소를 입력해 주세요.'}
                  </p>
                </div>
                {address.status === 'missing' ? (
                  <MypageAddressForm
                    mode="create"
                    returnHref={getCartHref()}
                    onSubmitAddress={createAddress}
                    onSaved={() => router.refresh()}
                  />
                ) : (
                  <MypageAddressForm
                    mode="edit"
                    initialAddress={address.address}
                    returnHref={getCartHref()}
                    onSubmitAddress={input => updateAddress(address.address.id, input)}
                    onSaved={() => router.refresh()}
                  />
                )}
              </>
            )}
          </section>

          <section aria-labelledby="checkout-items-title" className={CARD}>
            <SectionHeading id="checkout-items-title" aside={`${items.length}개`}>
              주문 상품
            </SectionHeading>
            <ul className="divide-y divide-gray-100">
              {items.map(item => (
                <li key={item.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0 md:gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                    <Image src={item.thumbnailUrl} alt="" fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-bold leading-snug md:text-base">{item.name}</p>
                      <p className="mt-1 text-xs font-bold text-gray-400 md:text-sm">
                        {item.color} / {item.size}
                        {item.priceOffset > 0 && ` (+${formatKoreanMoney(item.priceOffset * item.quantity)})`}
                        {' · '}
                        {item.quantity}개
                      </p>
                    </div>
                    <ProductPrice
                      price={item.price}
                      discount={item.discountRate}
                      size="compact"
                      quantity={item.quantity}
                      priceOffset={item.priceOffset}
                      className="shrink-0 items-end text-right"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="checkout-payment-title" className={CARD}>
            <SectionHeading id="checkout-payment-title">결제 수단</SectionHeading>
            <p className="flex items-center gap-3 rounded-md border-2 border-black px-4 py-3.5 text-sm font-black">
              <span aria-hidden="true" className="size-4 rounded-full border-[5px] border-black" />
              신용카드
            </p>
          </section>

          <p className="text-center text-xs text-gray-500 md:hidden">
            주문 내용을 확인했으며, 결제하면 주문이 바로 확정됩니다.
          </p>
        </div>

        <aside
          aria-labelledby="checkout-amount-title"
          className="hidden rounded-md bg-black p-8 text-white md:block lg:sticky lg:top-40"
        >
          <h2
            id="checkout-amount-title"
            className="mb-8 border-b border-gray-800 pb-4 text-2xl font-black tracking-tighter"
          >
            결제정보
          </h2>
          <dl className="space-y-4 font-medium">
            {renderDetails('text-gray-400')}
            <div className="flex items-end justify-between border-t border-gray-800 pt-6">
              <dt className="font-bold">총 결제 금액</dt>
              <dd className="text-[28px] leading-none font-black tracking-tight">
                {formatKoreanMoney(amounts.totalAmount)}
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-xs leading-relaxed text-gray-400">
            주문 내용을 확인했으며, 결제하면 주문이 바로 확정됩니다.
          </p>
          <div className="mt-4 space-y-3">
            {renderMessage()}
            <Button
              type="button"
              variant="outline"
              size="xl"
              disabled={!canPay || isPlacing}
              className="flex w-full items-center justify-center gap-3 text-lg font-black text-black"
              onClick={() => void handlePlaceOrder()}
            >
              <CreditCard className="size-6" />
              {payLabel}
            </Button>
            {renderPayHint('text-gray-400')}
          </div>
        </aside>
      </div>

      {expanded && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setExpanded(false)}
        />
      )}
      {/* The same bar as the cart: the total opens the breakdown, the button pays. */}
      <div className="fixed inset-x-0 bottom-(--mobile-bottom-nav-height) z-40 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:hidden">
        <div
          id="checkout-summary-details"
          inert={!expanded}
          className={cn(
            'mx-auto grid max-w-md transition-[grid-template-rows] duration-200 ease-out',
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <dl className="mb-3 space-y-2.5 border-b border-gray-200 px-1 pt-1 pb-3 text-sm font-medium text-black">
              {renderDetails('text-gray-500')}
            </dl>
          </div>
        </div>
        <div className="mx-auto max-w-md space-y-2">
          {renderMessage()}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls="checkout-summary-details"
              aria-label={`총 결제 금액 ${formatKoreanMoney(amounts.totalAmount)}, 결제정보 ${expanded ? '접기' : '펼치기'}`}
              className="-m-1 min-w-0 flex-1 rounded-md p-1 text-left focus-visible:ring-[3px] focus-visible:ring-black/20 focus-visible:outline-none"
              onClick={() => setExpanded(open => !open)}
            >
              <span className="block text-xs font-medium text-gray-500">총 결제 금액</span>
              <span className="flex items-center gap-1 text-base font-black tracking-tight text-black">
                <span className="truncate">{formatKoreanMoney(amounts.totalAmount)}</span>
                <ChevronUp
                  aria-hidden="true"
                  className={cn('size-5 shrink-0 transition-transform duration-200', expanded && 'rotate-180')}
                />
              </span>
            </button>
            <Button
              type="button"
              size="lg"
              disabled={!canPay || isPlacing}
              className="min-w-28 font-black"
              onClick={() => void handlePlaceOrder()}
            >
              {isPlacing ? '결제하는 중' : '결제하기'}
            </Button>
          </div>
          {renderPayHint('text-gray-500')}
        </div>
      </div>
    </Container>
  );
}

// The cart's item card frame.
const CARD = 'rounded-md border border-gray-200 p-4 md:border-2 md:border-gray-100 md:p-6';

function SectionHeading({ id, aside, children }: { id: string; aside?: string; children: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 id={id} className="text-base font-black tracking-tight md:text-lg">{children}</h2>
      {aside && <span className="text-xs font-bold text-gray-400">{aside}</span>}
    </div>
  );
}

function AmountRow({
  label,
  value,
  labelClassName,
  valueClassName,
}: {
  label: string;
  value: string;
  labelClassName: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={labelClassName}>{label}</dt>
      <dd className={valueClassName}>{value}</dd>
    </div>
  );
}
