import {
  RotateCcw,
  AlertCircle,
  Truck,
  CreditCard,
  CheckCircle2,
  Search,
  Package,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { CS_MENU } from '@/lib/navigation';
import { PageTitle } from '@/components/common/page-title';

const ReturnPolicyPage = () => {
  return (
    <div className="w-full max-w-6xl p-8 md:py-10">
      <PageTitle
        parent={{ label: '고객센터', href: '/cs' }}
        current="반품 및 환불 안내"
      />

      {/* 2. 핵심 요약 카드 (블랙 테마) */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {[
          {
            icon: RotateCcw,
            title: '접수 기한',
            desc: '상품 수령 후 7일 이내',
          },
          {
            icon: Truck,
            title: '반품 배송비',
            desc: '단순 변심 6,000원 / 불량 무료',
          },
          {
            icon: CreditCard,
            title: '환불 처리',
            desc: '영업일 기준 3~5일 소요',
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-black text-white p-8 rounded-xl border border-black transition-transform hover:-translate-y-1"
          >
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              {item.title}
            </h3>
            <p className="text-xl font-black">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* 3. 상세 안내 섹션 */}
      <div className="grid md:grid-cols-2 gap-16 mb-20">
        {/* 왼쪽: 반품/교환 절차 */}
        <div>
          <h2 className="text-2xl font-black mb-8 flex items-center gap-3 border-b-2 border-black pb-4 uppercase">
            <CheckCircle2 className="size-6" /> 반품/교환 절차
          </h2>
          <div className="space-y-8">
            {[
              {
                step: '01',
                title: '신청 접수',
                content:
                  '마이페이지 혹은 1:1 문의를 통해 반품/교환 신청을 접수합니다.',
              },
              {
                step: '02',
                title: '상품 수거',
                content:
                  '영업일 기준 1~3일 이내에 택배 기사님이 방문하여 상품을 수거합니다.',
              },
              {
                step: '03',
                title: '검수 및 승인',
                content:
                  '물류 센터에 상품 도착 후 검수를 거쳐 반품/교환 승인이 완료됩니다.',
              },
              {
                step: '04',
                title: '환불/재배송',
                content:
                  '결제 수단에 따라 환불되거나 새 상품으로 재배송됩니다.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <span className="text-2xl font-black italic text-gray-200 leading-none">
                  {item.step}
                </span>
                <div>
                  <h4 className="font-black text-lg mb-1">{item.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 불가 사유 */}
        <div className="bg-gray-50 p-8 md:p-12 rounded-2xl border border-gray-100">
          <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-red-600 uppercase">
            <AlertCircle className="size-6" /> 주의사항 (반품 불가)
          </h2>
          <ul className="space-y-6">
            {[
              '상품 수령 후 7일이 경과한 경우',
              '고객님의 책임 있는 사유로 상품이 훼손된 경우',
              '포장을 개봉하여 상품 가치가 현저히 상실된 경우',
              '복제가 가능한 상품의 포장을 훼손한 경우',
              '시간의 경과에 의해 재판매가 곤란할 정도로 가치가 하락한 경우',
            ].map((text, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm font-bold text-gray-700"
              >
                <span className="min-w-[4px] h-[4px] bg-red-600 mt-2 rounded-full" />
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-10 p-4 bg-white border border-gray-200 text-xs text-gray-400 font-medium">
            * 모니터 해상도 차이에 따른 색상 차이는 제품 불량 사유에 해당하지
            않습니다.
          </div>
        </div>
      </div>

      {/* 4. 하단 액션 섹션 (블랙 반전 테마) */}
      <div className="bg-black text-white p-12 md:p-16 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-10">
        <div>
          <h2 className="text-3xl font-black mb-4 tracking-tighter">
            문제가 해결되지 않으셨나요?
          </h2>
          <p className="text-gray-400 font-medium">
            담당 상담원이 신속하고 정확하게 안내를 도와드리겠습니다.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <ButtonLink
            href={
              CS_MENU.find(item => item.href === '/cs/return-request')?.href ||
              '#'
            }
            size="xl"
            variant="ghost"
            className="bg-white text-black font-black px-10 py-7 hover:bg-gray-200 transition-all text-lg"
          >
            반품/환불 신청하기
          </ButtonLink>
          <ButtonLink
            href={
              CS_MENU.find(item => item.href === '/cs/inquiry')?.href || '#'
            }
            size="xl"
            variant="ghost"
            className="border-2 border-white text-white font-black px-10 py-7 hover:bg-white hover:text-black transition-all text-lg"
          >
            1:1 문의하기
          </ButtonLink>
        </div>
      </div>

      <div className="border-t-4 border-black pt-10">
        <form className="space-y-10">
          {/* 주문 선택 섹션 */}
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Package className="size-5" /> 01. 주문 상품 정보
            </h2>
            <div className="grid md:grid-cols-[160px_1fr] gap-4 items-center">
              <label className="text-sm font-black uppercase tracking-widest text-black">
                주문 번호 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  placeholder="반품할 주문을 선택해 주세요"
                  className="flex-1 border-2 border-gray-200 p-4 font-bold text-sm bg-gray-50 outline-none cursor-not-allowed"
                />
                <button
                  type="button"
                  className="bg-black text-white px-6 font-bold text-sm hover:bg-gray-800 transition-all"
                >
                  주문 찾기
                </button>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 사유 입력 섹션 */}
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <AlertCircle className="size-5" /> 02. 반품 사유 선택
            </h2>
            <div className="grid md:grid-cols-[160px_1fr] gap-4 items-center">
              <label className="text-sm font-black uppercase tracking-widest text-black">
                사유 구분 <span className="text-red-500">*</span>
              </label>
              <select className="w-full border-2 border-gray-200 p-4 font-bold text-sm focus:border-black outline-none transition-all appearance-none bg-white">
                <option value="">반품 사유를 선택해 주세요</option>
                <option value="change_mind">
                  단순 변심 (배송비 본인 부담)
                </option>
                <option value="defective">
                  상품 불량 / 오배송 (배송비 판매자 부담)
                </option>
                <option value="size_issue">사이즈/색상 착오</option>
                <option value="etc">기타</option>
              </select>
            </div>

            <div className="grid md:grid-cols-[160px_1fr] gap-4 items-start">
              <label className="text-sm font-black uppercase tracking-widest text-black mt-4">
                상세 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                placeholder="상세 사유를 입력해 주세요. 불량의 경우 사진을 함께 첨부해 주시면 빠른 처리가 가능합니다."
                className="w-full border-2 border-gray-200 p-4 font-medium text-sm focus:border-black outline-none transition-all resize-none"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* 환불 정보 확인 */}
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <CheckCircle2 className="size-5" /> 03. 환불 예정 정보
            </h2>
            <div className="bg-gray-50 p-8 border border-gray-200">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-500">결제 수단</span>
                  <span className="font-black">
                    신용카드 (무통장 입금 시 계좌 정보 입력 필요)
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-500">반품 배송비</span>
                  <span className="font-black text-red-600">
                    6,000원 (환불금에서 차감)
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-black text-lg">
                    최종 환불 예정 금액
                  </span>
                  <span className="font-black text-2xl tracking-tighter">
                    42,000원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 유의사항 동의 */}
          <div className="p-6 border-2 border-black rounded-sm flex items-start gap-4">
            <input
              type="checkbox"
              id="return-agree"
              className="mt-1 size-5 accent-black"
            />
            <label
              htmlFor="return-agree"
              className="text-sm font-medium leading-relaxed cursor-pointer"
            >
              <span className="font-black text-black mr-2">[필수]</span>
              상품 수거 시 구성품 및 사은품이 모두 포함되어야 하며, 상품 가치가
              훼손된 경우 반품이 거부될 수 있음을 확인했습니다.
            </label>
          </div>

          {/* 하단 버튼 */}
          <div className="flex flex-col md:flex-row gap-4">
            <button
              type="submit"
              className="flex-1 bg-black text-white font-black py-6 text-xl hover:bg-gray-800 transition-all uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)]"
            >
              신청 완료하기
            </button>
            <ButtonLink
              href="/cs/return-policy"
              variant="ghost"
              className="flex-1 border-2 border-black font-black py-6 text-xl hover:bg-gray-100 transition-all uppercase tracking-widest text-center"
            >
              이전으로
            </ButtonLink>
          </div>
        </form>
      </div>

      {/* 안내 팁 */}
      <div className="mt-16 p-8 bg-gray-50 rounded-xl flex items-center gap-6">
        <div className="bg-white p-3 rounded-full border border-gray-200">
          <Search className="size-6 text-black" />
        </div>
        <p className="text-sm text-gray-500 font-medium">
          이미 접수된 반품 신청 내역은{' '}
          <span className="text-black font-black underline cursor-pointer">
            마이페이지 {'>'} 반품/환불 내역
          </span>
          에서 확인 및 취소가 가능합니다.
        </p>
      </div>
    </div>
  );
};

export default ReturnPolicyPage;
