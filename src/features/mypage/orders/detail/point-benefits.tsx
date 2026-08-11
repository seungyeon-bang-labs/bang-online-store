import type { MypageOrderPointBenefitViewModel } from '@/domains/mypage';

interface MypageOrderDetailPointBenefitsProps {
  benefits: readonly MypageOrderPointBenefitViewModel[];
}

export function MypageOrderDetailPointBenefits({
  benefits,
}: MypageOrderDetailPointBenefitsProps) {
  if (benefits.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="border-b border-zinc-200 p-4 md:p-5">
        <h3 className="font-black text-black">적립 혜택</h3>
      </header>
      <div className="space-y-2 p-4 md:p-5">
        {benefits.map(benefit => (
          <div
            key={benefit.type}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <p className="font-bold text-zinc-500">{benefit.label}</p>
            <p className="text-right font-black text-emerald-700">
              {benefit.amountText}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
