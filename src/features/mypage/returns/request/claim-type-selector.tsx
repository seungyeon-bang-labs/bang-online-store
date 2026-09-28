import { Button } from '@/shared/components/ui/button';
import { InputError } from '@/shared/components/ui/input';
import type { OrderClaimRequestType } from '@/domains/order/claim/domain';
import { MYPAGE_ACTION_CLASS_NAME } from '@/features/mypage/common/styles';
import { MypageFormLabel } from '@/features/mypage/common/form';

interface MypageClaimRequestTypeSelectorProps {
  errorMessage?: string;
  errorMessageId?: string;
  onSelect: (type: OrderClaimRequestType) => void;
  selectedType: OrderClaimRequestType | null;
}

export function MypageClaimRequestTypeSelector({
  errorMessage,
  errorMessageId,
  onSelect,
  selectedType,
}: MypageClaimRequestTypeSelectorProps) {
  return (
    <fieldset aria-describedby={errorMessage ? errorMessageId : undefined}>
      <MypageFormLabel as="legend" requirement="required">
        유형
      </MypageFormLabel>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(['exchange', 'return'] as const).map(type => (
          <Button
            key={type}
            type="button"
            variant="outline"
            aria-pressed={selectedType === type}
            className={`h-18 flex-col gap-0.5 ${selectedType === type
              ? `${MYPAGE_ACTION_CLASS_NAME.primary} border-black hover:text-white`
              : MYPAGE_ACTION_CLASS_NAME.outline
              }`}
            onClick={() => onSelect(type)}
          >
            <span className="text-base font-bold md:text-lg">
              {type === 'exchange' ? '교환' : '반품'}
            </span>
            <span
              className={`text-xs font-medium ${selectedType === type ? 'text-zinc-300' : 'text-zinc-500'
                }`}
            >
              {type === 'exchange' ? '다른 옵션으로 교환' : '상품 반송 후 환불'}
            </span>
          </Button>
        ))}
      </div>
      <InputError id={errorMessageId} message={errorMessage} />
    </fieldset>
  );
}
