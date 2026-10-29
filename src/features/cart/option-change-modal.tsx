'use client';

import * as React from 'react';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/components/ui/drawer';
import { ColorChip } from '@/shared/components/ui/color-chip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';
import { useCartState, useCartCommands } from './use-cart';
import { selectCartLocked } from './cart-selectors';
import type { ProductOptionViewModel } from '@/domains/product';

interface OptionChangeModalProps {
  itemId: string;
  currentProductId: number;
  currentVariantId: number;
  productOptionViewModels: readonly ProductOptionViewModel[];
}

export function OptionChangeModal({
  itemId,
  currentProductId,
  currentVariantId,
  productOptionViewModels,
}: OptionChangeModalProps) {
  const { changeOption } = useCartCommands();
  const pending = useCartState(selectCartLocked);
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [mounted, setMounted] = React.useState(false);

  // 그룹 안의 컬러를 중복 없이 모은다.
  const groupColors = React.useMemo(() => {
    const options = new Map<
      number,
      { id: number; label: string; hex: string }
    >();
    productOptionViewModels.forEach(product => {
      if (!options.has(product.color.id)) {
        options.set(product.color.id, {
          id: product.color.id,
          label: product.color.label,
          hex: product.color.hex,
        });
      }
    });
    return Array.from(options.values());
  }, [productOptionViewModels]);

  const [selectedColorId, setSelectedColorId] = React.useState<number | null>(
    null,
  );
  const [selectedSizeId, setSelectedSizeId] = React.useState<number | null>(
    null,
  );

  const sizeOptions = React.useMemo(() => {
    if (!selectedColorId) return [];
    const targetProduct = productOptionViewModels.find(
      product => product.color.id === selectedColorId,
    );
    return targetProduct ? targetProduct.variants : [];
  }, [productOptionViewModels, selectedColorId]);

  // 모달이 열릴 때 초기값 동기화
  React.useEffect(() => {
    if (open) {
      const currentColorId = productOptionViewModels.find(
        product => product.productId === currentProductId,
      )?.color.id;
      setSelectedColorId(currentColorId ?? groupColors[0]?.id ?? null);
      setSelectedSizeId(currentVariantId);
    }
  }, [
    open,
    currentProductId,
    currentVariantId,
    groupColors,
    productOptionViewModels,
  ]);

  const handleColorChange = (colorId: number) => {
    if (pending) return;
    setSelectedColorId(colorId);
    const targetProduct = productOptionViewModels.find(
      product => product.color.id === colorId,
    );

    // 장바구니에 담긴 사이즈가 아니라 화면에서 지금 고른 사이즈의 이름(S, M, L 등)을 기준으로,
    // 새 컬러에서 같은 이름이면서 재고가 있는 사이즈를 고른다. 없으면 비워 두고 사용자가 고르게 한다.
    const currentSelectedSizeName = productOptionViewModels
      .flatMap(product => product.variants)
      .find(v => v.id === selectedSizeId)?.size;

    const matchedVariant = targetProduct?.variants.find(
      v => v.size === currentSelectedSizeName && v.stock > 0,
    );

    setSelectedSizeId(matchedVariant?.id ?? null);
  };

  const handleApply = () => {
    if (!selectedColorId || !selectedSizeId || pending) return;
    const targetProduct = productOptionViewModels.find(
      product => product.color.id === selectedColorId,
    );
    // The cart shows the change at once and reports a failure itself.
    if (targetProduct && changeOption(itemId, targetProduct.productId, selectedSizeId)) setOpen(false);
  };

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isAllSoldOut =
    sizeOptions.length > 0 && sizeOptions.every(v => v.stock <= 0);

  const trigger = (
    <Button
      disabled={pending}
      variant="outline"
      size="xs"
      className="font-bold rounded-sm tracking-widest"
    >
      옵션 변경
    </Button>
  );

  const ModalInnerContent = (
    <div className="flex flex-col gap-8 py-4 px-4 sm:px-0">
      <section className="space-y-3">
        <h4 className="font-black text-base mb-2 flex items-center">색상</h4>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-6 gap-x-2">
          {groupColors.map(option => {
            const isSelected = selectedColorId === option.id;

            return (
              <ColorChip
                key={option.id}
                label={option.label}
                hex={option.hex}
                isSelected={isSelected}
                onClick={() => handleColorChange(option.id)}
              />
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="font-black text-base mb-2 flex items-center">사이즈</h4>
        <Select
          value={selectedSizeId === null ? '' : String(selectedSizeId)}
          disabled={isAllSoldOut || pending}
          onValueChange={value => {
            const variant = sizeOptions.find(
              option => String(option.id) === value,
            );
            if (variant) setSelectedSizeId(variant.id);
          }}
        >
          <SelectTrigger
            className={cn('w-full h-12 border-gray-200 focus:ring-black')}
            disabled={isAllSoldOut || pending}
          >
            <SelectValue
              placeholder={isAllSoldOut ? '전체 품절' : '사이즈를 선택해주세요'}
            />
          </SelectTrigger>
          <SelectContent>
            {sizeOptions.map(variant => (
              <SelectItem
                key={variant.id}
                value={String(variant.id)}
                disabled={variant.stock <= 0}
              >
                <div className="flex w-full items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-800">
                      {variant.size}
                    </span>
                    {/* 사이즈별 추가 요금 표시 */}
                    {variant.priceOffset > 0 && (
                      <span className="text-sm font-bold text-gray-800">
                        (+{variant.priceOffset.toLocaleString()}원)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {variant.stock <= 0 ? (
                      <span className="text-sm font-bold text-red-500">
                        품절
                      </span>
                    ) : variant.stock < 5 ? (
                      <span className="text-sm font-bold text-orange-500">
                        {variant.stock}개 남음
                      </span>
                    ) : null}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>
    </div>
  );

  // 데스크탑 버전 (Dialog)
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={next => { if (!pending) setOpen(next); }}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-sm rounded-md p-6 [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="font-black text-2xl tracking-tighter">
              옵션 변경
            </DialogTitle>
          </DialogHeader>
          {ModalInnerContent}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              disabled={pending}
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              취소
            </Button>
            <Button disabled={pending || !selectedSizeId} onClick={handleApply} size="lg" className="flex-1">
              변경 적용
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 모바일 버전 (Drawer)
  return (
    <Drawer open={open} onOpenChange={next => { if (!pending) setOpen(next); }}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left border-b border-gray-100 pb-4">
          <DrawerTitle className="font-black text-xl tracking-tighter px-4">
            옵션 변경
          </DrawerTitle>
        </DrawerHeader>
        {ModalInnerContent}
        <DrawerFooter className="flex-row gap-2 p-4 pt-0">
          <DrawerClose asChild>
            <Button
              disabled={pending}
              variant="outline"
              className="flex-1 h-14 rounded-2xl font-bold"
            >
              닫기
            </Button>
          </DrawerClose>
          <Button
            disabled={pending || !selectedSizeId}
            onClick={handleApply}
            className="flex-2 h-14 rounded-2xl bg-black text-white font-bold"
          >
            변경 내용 저장
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
