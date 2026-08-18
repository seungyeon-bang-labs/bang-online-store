import {
  CheckCircle2,
  CircleAlert,
  PackageSearch,
  Truck,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';

const RETURN_GUIDE_STEPS = [
  [
    '01',
    '신청할 상품 선택',
    '주문 내역에서 배송 완료된 상품의 교환·반품을 선택합니다.',
  ],
  [
    '02',
    '신청 내용 입력',
    '교환 또는 반품 유형과 사유를 입력하고 신청을 완료합니다.',
  ],
  [
    '03',
    '회수 및 검수',
    '등록된 회수 주소에서 신청 후 1~3영업일 내 상품을 회수하고 검수합니다.',
  ],
  [
    '04',
    '결과 처리',
    '교환은 검수 후 교환 상품을 발송하며, 반품은 환불을 진행합니다.',
  ],
] as const;

export function CustomerServiceExchangeReturnGuide() {
  return (
    <>
      <section className="mt-8 overflow-hidden rounded-md border border-zinc-300 bg-white">
        <div className="grid gap-px bg-zinc-200 md:grid-cols-3">
          <GuideSummary
            icon={CheckCircle2}
            title="신청 기한"
            description="상품 수령 후 7일 이내"
          />
          <GuideSummary
            icon={Truck}
            title="회수 일정"
            description="1~3영업일 내 방문"
          />
          <GuideSummary
            icon={CircleAlert}
            title="배송비"
            description="단순 변심 6,000원 / 불량 무료"
          />
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-md border border-zinc-300 bg-white">
        <header className="border-b border-zinc-300 px-4 py-4 md:px-5">
          <h2 className="text-xl font-black tracking-tight text-black">
            신청부터 처리까지
          </h2>
        </header>
        <ol className="divide-y divide-zinc-200">
          {RETURN_GUIDE_STEPS.map(([step, title, description]) => (
            <li key={step} className="flex gap-4 px-4 py-5 md:px-5">
              <span className="text-lg font-black tabular-nums text-zinc-300">
                {step}
              </span>
              <div>
                <h3 className="font-black text-black">{title}</h3>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-5 rounded-md border border-zinc-300 bg-zinc-50 p-4 md:p-5">
        <h2 className="font-black text-black">유의사항</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          구성품이나 사은품이 누락되었거나 상품 가치가 훼손된 경우 신청이 반려될 수 있습니다. 교환은 동일 상품의 다른 옵션으로만 신청할 수 있습니다.
        </p>
      </section>

      <div className="mt-8 grid grid-cols-2 gap-2">
        <ButtonLink
          href="/mypage/orders?period=3-months&status=delivered&page=1"
          variant="outline"
          className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-white hover:text-black"
        >
          <PackageSearch className="size-4" /> 배송 완료 주문 보기
        </ButtonLink>
        <ButtonLink
          href="/mypage/returns?type=all&status=all&page=1"
          className="w-full rounded-sm bg-black font-bold text-white hover:bg-zinc-800"
        >
          교환·반품 내역
        </ButtonLink>
      </div>
    </>
  );
}

function GuideSummary({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white px-4 py-5 md:px-5">
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-black" aria-hidden="true" />
        <p className="text-sm font-medium text-zinc-500">{title}</p>
      </div>
      <p className="mt-2 font-black text-black">{description}</p>
    </div>
  );
}
