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
import type { ProductVariantModel } from '@/domains/product';
import { useCartState, useCartCommands } from '@/features/cart/use-cart';
import { selectCartLocked } from '@/features/cart/cart-selectors';
import { toast } from 'sonner';
import { QuantitySelector } from '@/features/product/quantity-selector';
import { ColorChip } from '@/shared/components/ui/color-chip';
import { getCartHref } from '@/shared/lib/cart-routes';
import { getDiscountedPrice } from '@/domains/product/domain';

type ProductFormProps = {
  productId: number;
  colors: { id: number; label: string; hex: string }[];
  variants: readonly ProductVariantModel[];
  price: number;
  discount: number;
};

type SelectedItem = {
  id: number;
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
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const { addItems, retry } = useCartCommands();
  const phase = useCartState(state => state.phase);
  const message = useCartState(state => state.message);
  const cartLocked = useCartState(selectCartLocked);
  const isAllSoldOut = variants.every(variant => variant.stock <= 0);
  const discountedPrice = getDiscountedPrice(price, discount);

  const handleSizeSelect = (value: string) => {
    const variant = variants.find(v => String(v.id) === value);
    if (!variant || variant.stock <= 0) return;

    setSelectedItems(prev => {
      const isExist = prev.find(item => item.id === variant.id);
      if (isExist) {
        return prev.map(item =>
          item.id === variant.id
            ? { ...item, count: Math.min(item.count + 1, item.stock) }
            : item,
        );
      }

      return [
        ...prev,
        {
          id: variant.id,
          size: variant.size,
          count: 1,
          stock: variant.stock,
          priceOffset: variant.priceOffset,
        },
      ];
    });

    setSelectedSizeId(null);
  };

  const updateCount = (id: number, delta: number) => {
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

  const removeItem = (id: number) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  const totalPrice = selectedItems.reduce(
    (acc, item) => acc + (discountedPrice + item.priceOffset) * item.count,
    0,
  );

  // The cart reports a failure itself; success and clearing wait until the add is saved, so a failed add keeps the selections.
  const handleAddToCart = () => {
    if (cartLocked || selectedItems.length === 0) return;
    addItems(selectedItems.map(item => ({ productId, variantId: item.id, quantity: item.count })), () => {
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
    });
  };

  return (
    <div className="space-y-6">
      {colors.length > 1 && (
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
      )}

      <div className="space-y-3">
        <h4 className="font-black text-base mb-2 flex items-center">사이즈</h4>
        <Select
          value={selectedSizeId === null ? '' : String(selectedSizeId)}
          disabled={isAllSoldOut}
          onValueChange={handleSizeSelect}
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
      </div>

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

      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 md:flex">
        <Button variant="ghost" size="icon-lg" className="hover:bg-white group">
          <Heart className="size-6 text-gray-400 group-hover:fill-red-500 group-hover:stroke-red-500" />
        </Button>
        <Button
          variant="outline"
          size="xl"
          disabled={selectedItems.length === 0 || cartLocked}
          className="min-w-0 px-3 md:flex-1 md:px-8"
          onClick={handleAddToCart}
        >
          장바구니
        </Button>
        <Button
          variant="default"
          size="xl"
          disabled={selectedItems.length === 0}
          className="min-w-0 px-3 md:flex-1 md:px-8"
        >
          구매하기
        </Button>
      </div>
      {(phase === 'error' || phase === 'restricted') && (
        <div role={phase === 'error' ? 'alert' : 'status'} className="text-sm text-gray-600">
          <p>{message}</p>
          {phase === 'error' && <Button type="button" variant="outline" onClick={() => retry()}>다시 시도</Button>}
        </div>
      )}
    </div>
  );
}
