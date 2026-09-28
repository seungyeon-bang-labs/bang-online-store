import { ButtonLink } from '@/shared/components/ui/button';
import { CS_MENU } from '@/shared/lib/navigation';

export function QuickInfo() {
  return (
    <div className="grid md:grid-cols-2 gap-0 bg-black text-white rounded-2xl overflow-hidden">
      {/* 교환·반품 안내 */}
      <div className="p-12 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-800">
        <div>
          <h2 className="text-2xl font-black mb-8">교환·반품 안내</h2>
          <div className="space-y-4 mb-12">
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                요청 기한
              </p>
              <p className="text-base text-white font-semibold">
                상품 수령 후 7일 이내
              </p>
            </div>
            <div className="space-y-2 pt-6 border-t border-gray-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                배송비
              </p>
              <p className="text-base text-white font-semibold">
                단순 변심 시 왕복 배송비 발생
              </p>
            </div>
            <div className="space-y-2 pt-6 border-t border-gray-800">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                제품 결함
              </p>
              <p className="text-base text-white font-semibold">
                100% 무상 교환 및 환불
              </p>
            </div>
          </div>
        </div>
        <ButtonLink
          href={
            CS_MENU.find(item => item.href === '/cs/return-request')?.href ||
            '#'
          }
          size="xl"
          variant="ghost"
          className="border border-white text-white font-bold tracking-widest hover:bg-white hover:text-black transition-all"
        >
          교환·반품 신청
        </ButtonLink>
      </div>

      {/* 상담원 연결 및 시간 */}
      <div className="p-12 md:p-16 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-black mb-8">상담원 연결</h2>
          <div className="space-y-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                전화번호
              </p>
              <p className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                1588-0000
              </p>
            </div>
            <div className="space-y-2 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-white">평일</span>
                <span className="text-base text-gray-300">10:00 - 17:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-400">
                  점심
                </span>
                <span className="text-base text-gray-500">12:00 - 13:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-400">
                  휴무
                </span>
                <span className="text-base text-gray-500">주말 및 공휴일</span>
              </div>
            </div>
          </div>
        </div>
        <ButtonLink
          href={CS_MENU.find(item => item.href === '/cs/inquiry')?.href || '#'}
          size="xl"
          variant="ghost"
          className="border border-white text-white font-bold tracking-widest hover:bg-white hover:text-black transition-all mt-8"
        >
          1:1 문의하기
        </ButtonLink>
      </div>
    </div>
  );
}
