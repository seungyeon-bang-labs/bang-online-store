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
import { useCartStore } from '@/domains/cart';
import type { ProductOptionViewModel } from '@/domains/product';

interface OptionChangeModalProps {
  currentProductId: number;
  currentVariantId: string;
  productOptionViewModels: readonly ProductOptionViewModel[];
}

export function OptionChangeModal({
  currentProductId,
  currentVariantId,
  productOptionViewModels,
}: OptionChangeModalProps) {
  const updateOption = useCartStore(state => state.updateOption);
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [mounted, setMounted] = React.useState(false);

  // 1. 해당 그룹의 모든 컬러 옵션 데이터 추출
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

  // 2. 현재 선택된 컬러/사이즈 상태 관리
  const [selectedColorId, setSelectedColorId] = React.useState<number | null>(
    null,
  );
  const [selectedSizeId, setSelectedSizeId] = React.useState<string>('');

  // 3. 선택된 컬러에 따른 실시간 사이즈 옵션 목록 계산
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
      setSelectedColorId(currentColorId ?? groupColors[0]?.id);
      setSelectedSizeId(currentVariantId);
    }
  }, [open, currentProductId, currentVariantId, groupColors, productOptionViewModels]);

  // 컬러 변경 시 처리 로직
  const handleColorChange = (colorId: number) => {
    // 1. 우선 클릭한 컬러로 상태 업데이트
    setSelectedColorId(colorId);

    // 2. 새 컬러의 상품 정보 가져오기
    const targetProduct = productOptionViewModels.find(
      product => product.color.id === colorId,
    );

    // 3. [중요] '장바구니 기준'이 아닌 '현재 화면에서 선택된 사이즈의 명칭' 찾기
    // 현재 선택된 사이즈 ID(selectedSizeId)를 가진 variant를 전체 상품 데이터에서 찾아서 그 이름(S, M, L 등)을 가져옵니다.
    const currentSelectedSizeName = productOptionViewModels
      .flatMap(product => product.variants)
      .find(v => v.id === selectedSizeId)?.size;

    // 4. 새 컬러 상품(targetProduct)에서 방금 그 이름(L 등)과 똑같고 재고가 있는 옵션 찾기
    const matchedVariant = targetProduct?.variants.find(
      v => v.size === currentSelectedSizeName && v.stock > 0,
    );

    // 5. 매칭 성공하면 해당 ID로 변경, 실패하면 빈 값('')으로 두어 사용자 선택 유도
    setSelectedSizeId(matchedVariant?.id ?? '');
  };

  const handleApply = () => {
    if (!selectedColorId || !selectedSizeId) return;
    const targetProduct = productOptionViewModels.find(
      product => product.color.id === selectedColorId,
    );
    if (targetProduct) {
      updateOption(currentVariantId, targetProduct.productId, selectedSizeId);
      setOpen(false);
    }
  };

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isAllSoldOut =
    sizeOptions.length > 0 && sizeOptions.every(v => v.stock <= 0);

  // 공통 UI: 컬러칩과 사이즈 선택 영역
  const ModalInnerContent = (
    <div className="flex flex-col gap-8 py-4 px-4 sm:px-0">
      {/* 1. 컬러 선택 섹션 */}
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

      {/* 2. 사이즈 선택 섹션 */}
      <section className="space-y-3">
        <h4 className="font-black text-base mb-2 flex items-center">사이즈</h4>
        <Select
          value={selectedSizeId}
          disabled={isAllSoldOut}
          onValueChange={value => {
            setSelectedSizeId(value);
          }}
        >
          <SelectTrigger
            className={cn('w-full h-12 border-gray-200 focus:ring-black')}
            disabled={isAllSoldOut}
          >
            <SelectValue
              placeholder={isAllSoldOut ? '전체 품절' : '사이즈를 선택해주세요'}
            />
          </SelectTrigger>
          <SelectContent>
            {sizeOptions.map(variant => (
              <SelectItem
                key={variant.id}
                value={variant.id}
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="xs"
            className="font-bold rounded-sm tracking-widest"
          >
            옵션 변경
          </Button>
        </DialogTrigger>
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
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleApply}
              size="lg"
              className="flex-1"
            >
              변경 적용
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 모바일 버전 (Drawer)
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="xs"
          className="font-bold rounded-sm tracking-widest"
        >
          옵션 변경
        </Button>
      </DrawerTrigger>
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
              variant="outline"
              className="flex-1 h-14 rounded-2xl font-bold"
            >
              닫기
            </Button>
          </DrawerClose>
          <Button
            onClick={handleApply}
            className="flex-[2] h-14 rounded-2xl bg-black text-white font-bold"
          >
            변경 내용 저장
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
