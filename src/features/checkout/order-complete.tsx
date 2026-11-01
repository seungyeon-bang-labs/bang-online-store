import { PageTitle } from '@/shared/components/common/page-title';
import { Container } from '@/shared/components/layout/container';
import { ButtonLink } from '@/shared/components/ui/button';
import { getMypageOrderDetailHref } from '@/shared/lib/mypage-routes';

interface OrderCompleteProps {
  orderId: string;
  orderNumber: string;
}

export function OrderComplete({ orderId, orderNumber }: OrderCompleteProps) {
  return (
    <Container className="mb-20 pb-6 md:py-10">
      <PageTitle
        current="주문완료"
        className="mb-6 hidden border-b-2 pb-4 md:mb-12 md:flex md:border-b-4 md:pb-5"
      >
        <ol aria-label="주문 단계" className="flex items-center gap-2 text-sm font-black text-gray-300">
          <li>01. 장바구니</li>
          <li aria-hidden="true" className="mx-2">{'>'}</li>
          <li>02. 주문/결제</li>
          <li aria-hidden="true" className="mx-2">{'>'}</li>
          <li aria-current="step" className="text-black">03. 주문완료</li>
        </ol>
      </PageTitle>

      {/* Order details live on the order detail page; this only confirms the payment. */}
      <section aria-labelledby="order-complete-title" className="mx-auto max-w-md py-16 text-center md:py-24">
        <h2 id="order-complete-title" className="text-2xl font-black tracking-tight md:text-3xl">
          결제가 완료되었습니다
        </h2>
        <p className="mt-3 text-sm text-gray-500">
          주문 내역과 배송 상황은 주문 상세에서 확인할 수 있습니다.
        </p>
        <p className="mt-6 text-sm text-gray-600 tabular-nums">
          주문번호 <span className="ml-1 font-bold text-black">{orderNumber}</span>
        </p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <ButtonLink href={getMypageOrderDetailHref(orderId)} size="xl" className="font-black">
            주문 상세 보기
          </ButtonLink>
          <ButtonLink href="/" variant="outline" size="xl" className="font-black">
            쇼핑 계속하기
          </ButtonLink>
        </div>
      </section>
    </Container>
  );
}
