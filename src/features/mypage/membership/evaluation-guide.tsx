import { MypagePolicyCard } from '@/features/mypage/common';

const MEMBERSHIP_EVALUATION_GUIDE_ITEMS = [
  '최근 12개월 동안 구매가 완료된 주문을 기준으로 산정합니다.',
  '매월 1일 구매 실적을 기준으로 멤버십 등급이 자동 갱신됩니다.',
  '쿠폰·적립금·할인 금액을 제외한 실제 결제 금액만 반영됩니다.',
  '취소하거나 반품한 상품의 결제 금액은 구매 실적에서 제외됩니다.',
] as const;

export function MypageMembershipEvaluationGuide() {
  return (
    <MypagePolicyCard
      ariaLabel="등급 산정 기준"
      items={MEMBERSHIP_EVALUATION_GUIDE_ITEMS}
      listClassName="space-y-2 text-xs leading-5 md:space-y-2.5 md:leading-relaxed"
      mobileLayout="full-bleed"
      title="등급 산정 기준"
    />
  );
}
