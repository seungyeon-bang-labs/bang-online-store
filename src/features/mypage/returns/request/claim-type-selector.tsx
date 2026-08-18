import { Button } from '@/components/ui/button';
import { InputError } from '@/components/ui/input';
import type { OrderClaimRequestType } from '@/domains/order/domain';

interface MypageClaimRequestTypeSelectorProps {
  errorMessage?: string;
  onSelect: (type: OrderClaimRequestType) => void;
  selectedType: OrderClaimRequestType | null;
}

export function MypageClaimRequestTypeSelector({
  errorMessage,
  onSelect,
  selectedType,
}: MypageClaimRequestTypeSelectorProps) {
  return (
    <fieldset>
      <legend className="font-bold text-black">
        유형{' '}
        <span className="ml-1 text-sm font-medium text-zinc-500">
          (필수)
        </span>
      </legend>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(['exchange', 'return'] as const).map(type => (
          <Button
            key={type}
            type="button"
            variant="outline"
            className={`h-18 flex-col gap-0.5 rounded-sm shadow-none ${
              selectedType === type
                ? 'border-black bg-black text-white hover:bg-zinc-800 hover:text-white'
                : 'border-zinc-300 hover:border-black hover:bg-white hover:text-black'
            }`}
            onClick={() => onSelect(type)}
          >
            <span className="text-base font-bold md:text-lg">
              {type === 'exchange' ? '교환' : '반품'}
            </span>
            <span
              className={`text-xs font-medium ${
                selectedType === type ? 'text-zinc-300' : 'text-zinc-500'
              }`}
            >
              {type === 'exchange' ? '다른 옵션으로 교환' : '상품 반송 후 환불'}
            </span>
          </Button>
        ))}
      </div>
      <InputError message={errorMessage} />
    </fieldset>
  );
}
