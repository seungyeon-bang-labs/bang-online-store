'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartState, useCartCommands } from './use-cart';
import { selectCartLocked } from './cart-selectors';
import { PageTitle } from '@/shared/components/common/page-title';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { QuantitySelector } from '@/features/product/quantity-selector';
import { ProductPrice } from '@/features/product/product-price';
import { DeleteConfirmModal } from './delete-confirm-modal';
import { OptionChangeModal } from './option-change-modal';
import { CartSummary } from './cart-summary';
import { EmptyCart } from './empty-cart';
import { Container } from '@/shared/components/layout/container';
import { Button } from '@/shared/components/ui/button';

export function CartPageClient() {
  const { phase, cart, selectedIds, message } = useCartState(state => state);
  const { enterCart, retry, selectAll, setSelected, removeItems, adjustQuantity } = useCartCommands();
  const locked = useCartState(selectCartLocked);
  useEffect(() => { enterCart(); }, [enterCart]);
  const ready = phase === 'ready';
  const error = phase === 'error' || phase === 'restricted' ? message : null;
  const cartProducts = cart?.items ?? [];
  const purchasable = cartProducts.filter(item => item.canSelect);
  // The store keeps only selectable items of the current cart selected.
  const selected = new Set(selectedIds);
  const selectedProducts = ready ? purchasable.filter(item => selected.has(item.id)) : [];
  const allSelected = purchasable.length > 0 && selected.size === purchasable.length;
  const isIndeterminate = selected.size > 0 && !allSelected;
  const isInitialLoading = cart === null && !error;
  // Results are reported by the cart itself; true only means the change was taken.
  const handleDeleteSelected = () => !locked && selected.size > 0 && removeItems([...selected]);
  const handleDeleteItem = (id: string) => !locked && removeItems([id]);
  const handleUpdateCount = (id: string, delta: 1 | -1) => {
    if (!locked && cartProducts.some(item => item.id === id && item.canSelect)) adjustQuantity(id, delta);
  };

  return (
    <Container className="mb-20 py-6 pt-14 md:py-10 md:pt-10">
      <PageTitle
        current="장바구니"
        className="mb-6 hidden border-b-2 pb-4 md:mb-12 md:flex md:border-b-4 md:pb-5"
      >
        {/* (임시) breadcrumb로 교체 */}
        <div className="hidden md:flex items-center gap-2 text-sm font-black">
          <span className="text-black">01. 장바구니</span>
          <span className="text-gray-300 mx-2">{'>'}</span>
          <span className="text-gray-300">02. 주문결제</span>
          <span className="text-gray-300 mx-2">{'>'}</span>
          <span className="text-gray-300">03. 주문완료</span>
        </div>
      </PageTitle>

      <div className="grid items-start gap-6 pb-32 lg:grid-cols-[1fr_400px] lg:gap-12 lg:pb-0">
        <div className="space-y-6">
          {error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <p>{error}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => retry()}
                disabled={phase !== 'error'}
              >
                다시 시도
              </Button>
            </div>
          )}

          {isInitialLoading ? (
            <div
              aria-live="polite"
              className="flex min-h-56 items-center justify-center text-sm text-gray-500"
            >
              장바구니 상품을 불러오는 중입니다.
            </div>
          ) : (
            <>
              <div
                className={`sticky top-14 z-10 flex items-center justify-between border-b border-gray-200 bg-white py-3 transition-all duration-300 md:top-24 md:py-4 ${
                  cartProducts.length === 0 ? 'hidden md:flex' : ''
                }`}
              >
                <div className="group flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={
                      allSelected
                        ? true
                        : isIndeterminate
                          ? 'indeterminate'
                          : false
                    }
                    onCheckedChange={checked => selectAll(Boolean(checked))}
                    className="size-4 border border-black transition-all duration-200 data-[state=checked]:bg-black data-[state=checked]:text-white"
                    disabled={!ready || purchasable.length === 0}
                  />
                  <Label
                    htmlFor="select-all"
                    className="cursor-pointer select-none text-sm font-black uppercase group-hover:underline"
                  >
                    전체 선택
                  </Label>
                </div>
                <DeleteConfirmModal
                  onConfirm={handleDeleteSelected}
                  type="selected"
                  disableTrigger={locked || selected.size === 0}
                />
              </div>

              {/* 상품 아이템 루프 */}
              {cartProducts.map((item, index) => (
                // Price already includes size offset; apply discount for display.
                <div
                  key={item.id}
                  className="relative grid grid-cols-[auto_5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-3 overflow-hidden rounded-md border border-gray-200 p-4 transition-all md:flex md:gap-2 md:border-2 md:border-gray-100 md:p-6"
                >
                  <Checkbox
                    aria-label={`${item.name} 선택`}
                    disabled={!ready || !item.canSelect}
                    checked={selected.has(item.id)}
                    onCheckedChange={checked =>
                      setSelected(item.id, Boolean(checked))
                    }
                    className="size-4 border border-black data-[state=checked]:bg-black data-[state=checked]:text-white transition-all duration-200 self-start"
                  />

                  <div className="relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 md:h-28 md:w-28">
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 96px, 112px"
                      className="object-cover transition-transform duration-300"
                      priority={index < 3}
                    />
                  </div>

                  <div className="contents md:flex md:min-w-0 md:flex-1 md:flex-col md:justify-between">
                    {/* 상품 정보 및 개별 삭제*/}
                    <div className="min-w-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <h3 className="min-w-0 flex-1 text-sm font-black leading-snug hover:underline md:text-lg">
                          <Link
                            href={`/product/${item.productId}`}
                            className="block line-clamp-2"
                          >
                            {item.name}
                          </Link>
                        </h3>
                        <DeleteConfirmModal
                          onConfirm={() => handleDeleteItem(item.id)}
                          type="item"
                          disableTrigger={locked}
                        />
                      </div>

                      {/* 옵션 정보*/}
                      <div className="flex flex-wrap items-center gap-2 md:gap-4">
                        <p className="text-xs font-bold uppercase tracking-normal text-gray-400 md:text-sm md:tracking-widest">
                          {item.color} / {item.size}
                          {item.priceOffset > 0 && (
                            <span className="ml-1 text-xs tracking-normal md:text-sm">
                              (+
                              {(
                                item.priceOffset * item.quantity
                              ).toLocaleString()}
                              원)
                            </span>
                          )}
                        </p>
                        {/* 옵션 변경 버튼 */}
                        <OptionChangeModal
                          itemId={item.id}
                          currentVariantId={item.variantId}
                          currentProductId={item.productId}
                          productOptionViewModels={
                            cart?.optionGroups[item.styleId] ?? []
                          }
                        />
                      </div>
                    </div>

                    {/* 수량 조절 및 가격 */}
                    <div className="col-span-full flex items-end justify-between gap-3 border-t border-gray-100 pt-3 md:mt-0 md:border-0 md:pt-0">
                      {/* 수량 조절 */}
                      <fieldset disabled={locked || !item.canSelect}>
                      <QuantitySelector
                        count={item.quantity}
                        stock={item.stock}
                        onIncrease={() => handleUpdateCount(item.id, 1)}
                        onDecrease={() => handleUpdateCount(item.id, -1)}
                        className="[&_button]:size-8 md:[&_button]:size-6"
                      />

                      </fieldset>

                      {/* 가격 섹션 */}
                      <ProductPrice
                        price={item.price}
                        discount={item.discountRate}
                        size="compact"
                        quantity={item.quantity}
                        priceOffset={item.priceOffset}
                        className="text-right"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* 비어있을 때 (참고용) */}
              {ready && <EmptyCart isEmpty={cartProducts.length === 0} />}
            </>
          )}
        </div>

        <div
          className={cartProducts.length === 0 ? 'hidden md:block' : undefined}
        >
          <CartSummary selectedProducts={selectedProducts} />
        </div>
      </div>
    </Container>
  );
}
