import { Checkbox } from '@/shared/components/ui/checkbox';
import { InputError } from '@/shared/components/ui/input';

interface MypageClaimRequestAgreementProps {
  agreed: boolean;
  errorMessage?: string;
  errorMessageId?: string;
  onAgreementChange: (agreed: boolean) => void;
}

export function MypageClaimRequestAgreement({
  agreed,
  errorMessage,
  errorMessageId,
  onAgreementChange,
}: MypageClaimRequestAgreementProps) {
  return (
    <div className="mt-4 md:mt-5">
      <div className="flex items-start gap-3">
        <Checkbox
          id="claim-agreement"
          checked={agreed}
          aria-describedby={errorMessage ? errorMessageId : undefined}
          onCheckedChange={value => onAgreementChange(value === true)}
          className="mt-1.5 cursor-pointer rounded-sm md:mt-1"
        />
        <label
          htmlFor="claim-agreement"
          className="cursor-pointer text-sm leading-6 text-zinc-700"
        >
          <strong className="mr-1 text-black">[필수]</strong>
          구성품을 포함해 상품을 반송하며, 검수 결과에 따라 신청이 반려될 수 있음을 확인했습니다.
        </label>
      </div>
      <InputError id={errorMessageId} message={errorMessage} />
    </div>
  );
}
