import { Button, ButtonLink } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { InputError } from '@/components/ui/input';
import type { OrderClaimRequestType } from '@/domains/order/domain';

interface MypageClaimRequestAgreementActionsProps {
  agreed: boolean;
  errorMessage?: string;
  onAgreementChange: (agreed: boolean) => void;
  orderId: string;
  type: OrderClaimRequestType;
}

export function MypageClaimRequestAgreementActions({
  agreed,
  errorMessage,
  onAgreementChange,
  orderId,
  type,
}: MypageClaimRequestAgreementActionsProps) {
  return (
    <>
      <div className="mt-8">
        <div className="flex items-start gap-3">
          <Checkbox
            id="claim-agreement"
            checked={agreed}
            onCheckedChange={value => onAgreementChange(value === true)}
            className="mt-0.5 rounded-sm"
          />
          <label
            htmlFor="claim-agreement"
            className="text-sm leading-6 text-zinc-700"
          >
            <strong className="mr-1 text-black">[필수]</strong>
            구성품을 포함해 상품을 반송하며, 검수 결과에 따라 신청이 반려될 수 있음을 확인했습니다.
          </label>
        </div>
        <InputError message={errorMessage} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <ButtonLink
          href={`/mypage/orders/${orderId}`}
          variant="outline"
          className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-white hover:text-black"
        >
          취소
        </ButtonLink>
        <Button
          type="submit"
          className="w-full rounded-sm bg-black font-bold text-white hover:bg-zinc-800"
        >
          {type === 'exchange' ? '교환 신청' : '반품 신청'}
        </Button>
      </div>
    </>
  );
}
