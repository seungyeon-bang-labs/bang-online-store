import type { OrderDetailShippingViewModel } from '@/domains/order';

interface MypageOrderDetailShippingProps {
  shipping: OrderDetailShippingViewModel;
}

export function MypageOrderDetailShipping({
  shipping,
}: MypageOrderDetailShippingProps) {
  return (
    <section className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="border-b border-zinc-200 p-4 md:p-5">
        <h3 className="font-black text-black">배송지 정보</h3>
      </header>
      <dl className="grid gap-3 p-4 text-sm md:grid-cols-[96px_minmax(0,1fr)] md:gap-y-4 md:p-5">
        <div className="grid gap-1 md:contents">
          <dt className="font-bold text-zinc-500">받는 분</dt>
          <dd className="font-bold text-black">{shipping.recipientName}</dd>
        </div>
        <div className="grid gap-1 md:contents">
          <dt className="font-bold text-zinc-500">전화번호</dt>
          <dd className="font-bold text-black">{shipping.recipientPhone}</dd>
        </div>
        <div className="grid gap-1 md:contents">
          <dt className="font-bold text-zinc-500">주소</dt>
          <dd className="font-bold leading-relaxed text-black">
            {shipping.addressText}{' '}
            <span className="whitespace-nowrap text-zinc-500">
              ({shipping.postalCode})
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
