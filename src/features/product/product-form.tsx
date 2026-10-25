'use client';

import { useEffect, useState } from 'react';
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
  const [pending, setPending] = useState(false);
  const access = useCartState(state => state.access);
  const settledRequests = useCartState(state => state.settledRequests);
  const [recovery, setRecovery] = useState<{ requestId: string; userId: string; items: SelectedItem[] } | null>(null);
  const [shownRecoveries] = useState(() => new Set<string>());
  const locked = pending || recovery !== null;
  const search = searchParams.toString();
  const cartHref = getCartHref(search ? pathname + '?' + search : pathname);

  useEffect(() => {
    if (!recovery) return;
    if (access && (access.status !== 'member' || access.userId !== recovery.userId)) { setRecovery(null); return; }
    if (access?.status !== 'member') return;
    const result = settledRequests[recovery.requestId];
    if (!result || shownRecoveries.has(recovery.requestId)) return;
    shownRecoveries.add(recovery.requestId);
    setRecovery(null);
    if (result.outcome === 'rejected') {
      if (!result.notices.length) toast.info('현재 선택한 상품을 담을 수 없습니다. 재고와 판매 상태를 확인해주세요.');
      return;
    }
    setSelectedItems(items => items.filter(item => !recovery.items.some(captured => captured.id === item.id && captured.count === item.count)));
    toast.success('상품이 장바구니에 담겼습니다.', { position: 'bottom-center', action: { label: '보러가기', onClick: () => router.push(cartHref) }, duration: 3000 });
  }, [recovery, access, settledRequests, shownRecoveries, router, cartHref]);
  const isAllSoldOut = variants.every(variant => variant.stock <= 0);
  const discountedPrice = getDiscountedPrice(price, discount);

  const handleSizeSelect = (value: string) => {
    if (locked) return;
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
    if (locked) return;
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
    if (locked) return;
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  const totalPrice = selectedItems.reduce(
    (acc, item) => acc + (discountedPrice + item.priceOffset) * item.count,
    0,
  );

  const handleAddToCart = async () => {
    if (phase !== 'ready' || locked || selectedItems.length === 0) return;
    setPending(true);
    try {
      const reply = await addItems(selectedItems.map(item => ({ productId, variantId: item.id, quantity: item.count })));
      if (reply.status !== 'ok') {
        // Only an unconfirmed (retryable) request may still apply later; a server-confirmed rejection is final.
        if (reply.status === 'retryable' && reply.requestId && access?.status === 'member') setRecovery({ requestId: reply.requestId, userId: access.userId, items: selectedItems });
        toast.error('message' in reply ? reply.message : '장바구니 계정이 변경되었습니다. 다시 확인해주세요.');
        return;
      }
      if (reply.cart.operation?.outcome === 'rejected') {
        if (!reply.cart.notices.length) toast.info('현재 선택한 상품을 담을 수 없습니다. 재고와 판매 상태를 확인해주세요.');
        return;
      }
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
    } catch { toast.error('장바구니 요청을 확인하지 못했습니다. 다시 시도해주세요.'); }
    finally { setPending(false); }
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
          disabled={isAllSoldOut || locked}
          onValueChange={handleSizeSelect}
        >
          <SelectTrigger
            className={cn('w-full h-12 border-gray-200 focus:ring-black')}
            disabled={isAllSoldOut || locked}
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
          disabled={selectedItems.length === 0 || phase !== 'ready' || locked}
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
      {/* The form's own add (mutating) and background syncs keep the confirmed cart; only a lock needs this line. */}
      {(phase === 'checking' || phase === 'restoring' || phase === 'retryable' || phase === 'restricted' || recovery) && (
        <div role={phase === 'retryable' ? 'alert' : 'status'} className="text-sm text-gray-600">
          <p>{message ?? (phase === 'restricted' ? '이메일 인증과 회원 상태를 확인해주세요.' : '장바구니를 확인하고 있습니다.')}</p>
          {(phase === 'retryable' || recovery) && <Button type="button" variant="outline" onClick={() => void retry()}>다시 시도</Button>}
        </div>
      )}
    </div>
  );
}
