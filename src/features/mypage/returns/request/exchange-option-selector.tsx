'use client';

import { ColorChip } from '@/shared/components/ui/color-chip';
import { InputError } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { OrderClaimRequestColorOptionViewModel } from '@/domains/order/claim/view-model';
import { MypageFormLabel } from '@/features/mypage/common/form';
import { MYPAGE_INPUT_CLASS_NAME } from '@/features/mypage/common/styles';

interface MypageClaimExchangeOptionSelectorProps {
  colorOptions: readonly OrderClaimRequestColorOptionViewModel[];
  currentProductId: number;
  currentVariantId: string;
  currentVariantLabel: string;
  selectedProductId: number;
  selectedVariantId: string;
  errorMessage?: string;
  errorMessageId?: string;
  onSelectionChange: (productId: number, variantId: string) => void;
}

function getVariantLabelById(
  colorOptions: readonly OrderClaimRequestColorOptionViewModel[],
  variantId: string,
): string | null {
  return (
    colorOptions
      .flatMap(colorOption => colorOption.variants)
      .find(variant => variant.id === variantId)?.label ?? null
  );
}

export function MypageClaimExchangeOptionSelector({
  colorOptions,
  currentProductId,
  currentVariantId,
  currentVariantLabel,
  selectedProductId,
  selectedVariantId,
  errorMessage,
  errorMessageId,
  onSelectionChange,
}: MypageClaimExchangeOptionSelectorProps) {
  const selectedColorOption =
    colorOptions.find(option => option.productId === selectedProductId) ??
    colorOptions[0];
  const selectedSizeLabel =
    getVariantLabelById(colorOptions, selectedVariantId) ??
    currentVariantLabel;

  if (!selectedColorOption) return null;

  function handleColorChange(productId: number) {
    const nextColorOption = colorOptions.find(
      option => option.productId === productId,
    );
    const nextVariantId = nextColorOption?.variants.find(
      variant =>
        variant.label === selectedSizeLabel &&
        variant.isAvailable &&
        variant.isExchangeable,
    )?.id;

    onSelectionChange(productId, nextVariantId ?? '');
  }

  return (
    <div className="mt-6">
      <MypageFormLabel as="p" requirement="required">
        교환할 옵션
      </MypageFormLabel>
      <div className="pl-3">
        {colorOptions.length > 1 && (
          <section className="mt-4" aria-labelledby="exchange-color-title">
            <h3 id="exchange-color-title" className="text-sm font-bold text-black">
              색상
            </h3>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-4">
              {colorOptions.map(option => (
                <ColorChip
                  key={option.productId}
                  label={option.label}
                  hex={option.hex}
                  isSelected={option.productId === selectedColorOption.productId}
                  onClick={() => handleColorChange(option.productId)}
                />
              ))}
            </div>
          </section>
        )}
        <section className="mt-5" aria-labelledby="exchange-size-title">
          <h3 id="exchange-size-title" className="text-sm font-bold text-black">
            사이즈
          </h3>
          <Select
            value={selectedVariantId}
            onValueChange={variantId =>
              onSelectionChange(selectedColorOption.productId, variantId)
            }
          >
            <SelectTrigger
              id="exchange-option"
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? errorMessageId : undefined}
              className={`mt-2 w-full ${MYPAGE_INPUT_CLASS_NAME}`}
            >
              <SelectValue placeholder="사이즈를 선택해 주세요" />
            </SelectTrigger>
            <SelectContent className="border-zinc-300 bg-white">
              {selectedColorOption.variants.map(variant => {
                const isCurrentOption =
                  selectedColorOption.productId === currentProductId &&
                  variant.id === currentVariantId;
                return (
                  <SelectItem
                    key={variant.id}
                    value={variant.id}
                    disabled={
                      !variant.isAvailable ||
                      !variant.isExchangeable ||
                      isCurrentOption
                    }
                  >
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-sm font-bold text-zinc-800">
                        {variant.label}
                      </span>
                      <div className="flex items-center gap-3">
                        {!variant.isAvailable ? (
                          <span className="text-sm font-bold text-red-500">
                            품절
                          </span>
                        ) : isCurrentOption ? (
                          <span className="text-sm font-bold text-zinc-400">
                            현재 옵션
                          </span>
                        ) : !variant.isExchangeable ? (
                          <span className="text-sm font-bold text-zinc-500">
                            가격 차이로 교환 불가
                          </span>
                        ) : variant.stock < 5 ? (
                          <span className="text-sm font-bold text-orange-500">
                            {variant.stock}개 남음
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="mt-2 text-sm font-medium text-zinc-500">
            가격이 다른 옵션은 반품 후 재주문해 주세요.
          </p>
        </section>
      </div>
      <InputError id={errorMessageId} message={errorMessage} />
    </div>
  );
}
