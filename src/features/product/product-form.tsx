'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Heart, X } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components/ui/select';
import { type Variant } from '@/domains/product';
import { useCartStore } from '@/domains/cart';
import { toast } from 'sonner';
import { QuantitySelector } from '@/features/product/quantity-selector';
import { ColorChip } from '@/shared/components/ui/color-chip';
import { getCartHref } from '@/shared/lib/cart-routes';

type ProductFormProps = {
  productId: number;
  colors: { id: number; label: string; hex: string }[];
  variants: Variant[];
  price: number;
  discount: number;
};

type SelectedItem = {
  id: string;
  size: string;
  count: number;
  stock: number;
  priceOffset: number;
};

export function ProductForm({
  productId,
  colors,
  variants,
  price,
  discount,
}: ProductFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedSizeId, setSelectedSizeId] = useState('');
  const { addToCart } = useCartStore();
  const isAllSoldOut = variants.every(variant => variant.stock <= 0);
  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount
    ? Math.floor(price * (1 - discount / 100))
    : price;

  // 1. 사이즈 선택 시 항목 추가
  const handleSizeSelect = (value: string) => {
    const variant = variants.find(v => v.id === value);
    if (!variant) return;

    setSelectedItems(prev => {
      const isExist = prev.find(item => item.id === variant.id);
      if (isExist) {
        // 이미 있으면 수량만 증가 (재고 범위 내에서)
        return prev.map(item =>
          item.id === variant.id
            ? { ...item, count: Math.min(item.count + 1, item.stock) }
            : item,
        );
      }
      // 없으면 새로 추가
      return [
        ...prev,
        {
          id: variant.id,
          size: variant.size,
          count: 1,
          stock: variant.stock,
          priceOffset: variant.price_offset,
        },
      ];
    });

    setSelectedSizeId('');
  };

  // 2. 수량 변경 로직
  const updateCount = (id: string, delta: number) => {
    setSelectedItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newCount = item.count + delta;
          return newCount >= 1 && newCount <= item.stock
            ? { ...item, count: newCount }
            : item;
        }
        return item;
      }),
    );
  };

  // 3. 항목 삭제 로직
  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  // 4. 총 합계 금액 계산
  const totalPrice = selectedItems.reduce(
    (acc, item) => acc + (discountedPrice + item.priceOffset) * item.count,
    0,
  );

  const handleAddToCart = () => {
    selectedItems.forEach(item => {
      addToCart(productId, item.id, item.count);
    });
    setSelectedItems([]);
    toast.success('상품이 장바구니에 담겼습니다.', {
      position: 'bottom-center',
      action: {
        label: '보러가기',
        onClick: () => {
          const search = searchParams.toString();
          router.push(getCartHref(search ? `${pathname}?${search}` : pathname));
        },
      },
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6">
      {/* 컬러 칩 섹션 (생략 없이 유지) */}
      <div className="space-y-3">
        <h4 className="font-black text-base mb-2 flex items-center">색상</h4>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-6 gap-x-2">
          {colors.map(option => {
            const isSelected = productId === option.id;

            return (
              <ColorChip
                key={option.id}
                label={option.label}
                hex={option.hex}
                isSelected={isSelected}
                onClick={() => {
                  router.push(`/product/${option.id}`);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 사이즈 선택 섹션 */}
      <div className="space-y-3">
        <h4 className="font-black text-base mb-2 flex items-center">사이즈</h4>
        <Select
          value={selectedSizeId}
          disabled={isAllSoldOut}
          onValueChange={value => {
            setSelectedSizeId(value);
            handleSizeSelect(value);
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
            {variants.map(variant => (
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
                    {variant.price_offset > 0 && (
                      <span className="text-sm font-bold text-gray-800">
                        (+{variant.price_offset.toLocaleString()}원)
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
      </div>

      {/* 💡 선택된 항목 리스트 (액션 버튼 위) */}
      {selectedItems.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {selectedItems.map(item => (
            <div
              key={item.id}
              className="bg-gray-100 p-4 rounded-md flex flex-col gap-3 relative"
            >
              <button
                onClick={() => removeItem(item.id)}
                className="absolute top-3 right-3 text-gray-400 hover:text-black transition-colors"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-center pr-6 gap-2">
                <span className="text-sm font-bold text-gray-900">
                  {item.size} 사이즈
                </span>
                {item.priceOffset > 0 && (
                  <span className="tracking-normal text-sm font-bold">
                    (+{item.priceOffset.toLocaleString()}원)
                  </span>
                )}
              </div>

              <div className="flex justify-between items-end">
                {/* 수량 조절기 */}
                <QuantitySelector
                  count={item.count}
                  stock={item.stock}
                  onIncrease={() => updateCount(item.id, 1)}
                  onDecrease={() => updateCount(item.id, -1)}
                />
                {/* 개별 항목 가격 */}
                <span className="text-sm font-black text-gray-900">
                  {(
                    (discountedPrice + item.priceOffset) *
                    item.count
                  ).toLocaleString()}
                  원
                </span>
              </div>
            </div>
          ))}

          {/* 총 합계 금액 */}
          <div className="flex justify-between items-center py-4 px-2 border-t border-gray-100">
            <span className="text-sm font-bold text-gray-500">
              총 주문 금액
            </span>
            <span className="text-xl font-black text-red-600">
              {totalPrice.toLocaleString()}원
            </span>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2 items-center">
        <Button variant="ghost" size="icon" className="hover:bg-white group">
          <Heart className="size-6 text-gray-400 group-hover:fill-red-500 group-hover:stroke-red-500" />
        </Button>
        <Button
          variant="outline"
          size="xl"
          disabled={selectedItems.length === 0}
          className="flex-1"
          onClick={handleAddToCart}
        >
          장바구니
        </Button>
        <Button
          variant="default"
          size="xl"
          disabled={selectedItems.length === 0}
          className="flex-1"
        >
          구매하기
        </Button>
      </div>
    </div>
  );
}
