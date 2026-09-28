import type { MypageOrderPointBenefitViewModel } from '@/domains/mypage';
import { MypageAmountRow, MypageCard } from '@/features/mypage/common';

interface MypageOrderDetailPointBenefitsProps {
  benefits: readonly MypageOrderPointBenefitViewModel[];
}

export function MypageOrderDetailPointBenefits({
  benefits,
}: MypageOrderDetailPointBenefitsProps) {
  if (benefits.length === 0) return null;

  return (
    <MypageCard.Collapsible title="적립 혜택" mobileLayout="full-bleed">
      <MypageCard.Body className="space-y-2">
        {benefits.map(benefit => (
          <MypageAmountRow
            key={benefit.type}
            label={benefit.label}
            value={benefit.amountText}
            tone="positive"
          />
        ))}
      </MypageCard.Body>
    </MypageCard.Collapsible>
  );
}
