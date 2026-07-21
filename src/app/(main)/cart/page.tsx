'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { PageTitle } from '@/components/common/page-title';
import { useCartStore, type CartItem } from '@/lib/store/cart';
import { products, colorMap } from '@/lib/products-data';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { QuantitySelector } from '@/features/product/quantity-selector';
import { ProductPrice } from '@/features/product/product-price';
import { DeleteConfirmModal } from '@/features/cart/delete-confirm-modal';
import { OptionChangeModal } from '@/features/cart/option-change-modal';
import { CartSummary } from '@/features/cart/cart-summary';
import { EmptyCart } from '@/features/cart/empty-cart';
import { getProductDiscount } from '@/shared/lib/utils';

type CartProduct = CartItem & {
  id: string;
  name: string;
  option: string;
  price: number;
  imageUrl: string;
  color: string;
  discount: number;
  priceOffset: number;
  stock: number;
  groupId: number;
};

const getCartProducts = (cartItems: CartItem[]) => {
  return cartItems
    .map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;
      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) return null;
      const colorOption = colorMap.find(color => color.id === product.colorId);
      if (!colorOption) return null;
      const discount = getProductDiscount(product.id);
      return {
        ...item,
        id: item.variantId,
        name: product.name,
        option: variant.size,
        stock: variant.stock,
        priceOffset: variant.price_offset,
        price: product.price,
        imageUrl: product.thumbnailImage,
        color: colorOption.label,
        discount: discount,
        groupId: product.group_id,
      };
    })
    .filter(Boolean) as CartProduct[];
};

const CartPage = () => {
  const {
    items,
    selectedIds,
    removeFromCart,
    clearCart,
    updateQuantity,
    setSelectedIds,
    toggleSelected,
    selectAll,
  } = useCartStore();
  const cartProducts = useMemo(() => getCartProducts(items), [items]);
  const currentIds = useMemo(
    () => new Set(cartProducts.map(item => item.id)),
    [cartProducts],
  );

  const validSelectedIds = useMemo(() => {
    if (selectedIds.length === 0) return new Set<string>();
    return new Set(selectedIds.filter(id => currentIds.has(id)));
  }, [selectedIds, currentIds]);

  const selectedProducts = useMemo(() => {
    if (validSelectedIds.size === 0) return [] as CartProduct[];
    return cartProducts.filter(item => validSelectedIds.has(item.id));
  }, [cartProducts, validSelectedIds]);

  const allSelected =
    cartProducts.length > 0 && validSelectedIds.size === cartProducts.length;
  const isIndeterminate = validSelectedIds.size > 0 && !allSelected;

  const handleToggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }

    selectAll(cartProducts.map(item => item.id));
  };

  const handleToggleItem = (variantId: string, checked: boolean) => {
    toggleSelected(variantId, checked);
  };

  const handleDeleteSelected = () => {
    if (validSelectedIds.size === 0) return;

    if (validSelectedIds.size === cartProducts.length) {
      clearCart();
      return;
    }

    validSelectedIds.forEach(variantId => removeFromCart(variantId));
    setSelectedIds([]);
  };

  const handleDeleteItem = (variantId: string) => {
    removeFromCart(variantId);
  };

  const handleUpdateCount = (variantId: string, delta: number) => {
    const targetItem = cartProducts.find(item => item.id === variantId);
    if (!targetItem) return;

    if (targetItem.stock <= 0) {
      handleDeleteItem(variantId);
      return;
    }

    const nextQuantity = Math.min(
      Math.max(targetItem.quantity + delta, 1),
      targetItem.stock,
    );

    updateQuantity(variantId, nextQuantity);
  };

  return (
    <div className="w-full max-w-6xl p-8 md:py-10">
      <PageTitle current="장바구니" className="mb-12">
        {/* (임시) breadcrumb로 교체 */}
        <div className="hidden md:flex items-center gap-2 text-sm font-black">
          <span className="text-black">01. 장바구니</span>
          <span className="text-gray-300 mx-2">{'>'}</span>
          <span className="text-gray-300">02. 주문결제</span>
          <span className="text-gray-300 mx-2">{'>'}</span>
          <span className="text-gray-300">03. 주문완료</span>
        </div>
      </PageTitle>

      <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
        <div className="space-y-6">
          <div className="flex justify-between items-center py-4 border-b border-gray-200 bg-white sticky top-16  sm:top-24 transition-all duration-300 z-10">
            <div className="flex items-center gap-2 group">
              <Checkbox
                id="select-all"
                checked={
                  allSelected ? true : isIndeterminate ? 'indeterminate' : false
                }
                onCheckedChange={checked =>
                  handleToggleSelectAll(Boolean(checked))
                }
                className="size-4 border border-black data-[state=checked]:bg-black data-[state=checked]:text-white transition-all duration-200"
                disabled={cartProducts.length === 0}
              />
              <Label
                htmlFor="select-all"
                className="text-sm font-black uppercase cursor-pointer group-hover:underline select-none"
              >
                전체 선택
              </Label>
            </div>
            <DeleteConfirmModal
              onConfirm={handleDeleteSelected}
              type="selected"
              disableTrigger={validSelectedIds.size === 0}
            />
          </div>

          {/* 상품 아이템 루프 */}
          {cartProducts.map((item, index) => (
            // Price already includes size offset; apply discount for display.
            <div
              key={item.id}
              className="flex gap-2 p-6 border-2 border-gray-100 transition-all relative overflow-hidden rounded-md"
            >
              <Checkbox
                checked={validSelectedIds.has(item.id)}
                onCheckedChange={checked =>
                  handleToggleItem(item.id, Boolean(checked))
                }
                className="size-4 border border-black data-[state=checked]:bg-black data-[state=checked]:text-white transition-all duration-200 self-start"
              />

              <div className="relative w-24 h-24 sm:w-28 sm:h-28 aspect-square bg-zinc-100 rounded-md overflow-hidden shrink-0">
                <Image
                  src={`/images/${item.imageUrl}`}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 96px, 112px"
                  className="object-cover transition-transform duration-300"
                  priority={index < 3}
                />
              </div>

              <div className="flex flex-col w-full justify-between">
                {/* 상품 정보 및 개별 삭제*/}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black hover:underline">
                      <Link
                        href={`/product/${item.productId}`}
                        className="block"
                      >
                        {item.name}
                      </Link>
                    </h3>
                    <DeleteConfirmModal
                      onConfirm={() => handleDeleteItem(item.id)}
                      type="item"
                    />
                  </div>

                  {/* 옵션 정보*/}
                  <div className="flex flex-wrap items-center gap-4">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                      {item.color} / {item.option}
                      {item.priceOffset > 0 && (
                        <span className="tracking-normal text-sm ml-1">
                          (+
                          {(item.priceOffset * item.quantity).toLocaleString()}
                          원)
                        </span>
                      )}
                    </p>
                    {/* 옵션 변경 버튼 */}
                    <OptionChangeModal
                      groupId={item.groupId}
                      currentVariantId={item.variantId}
                      currentProductId={item.productId}
                    />
                  </div>
                </div>

                {/* 수량 조절 및 가격 */}
                <div className="flex justify-between items-end">
                  {/* 수량 조절 */}
                  <QuantitySelector
                    count={item.quantity}
                    stock={item.stock}
                    onIncrease={() => handleUpdateCount(item.id, 1)}
                    onDecrease={() => handleUpdateCount(item.id, -1)}
                  />

                  {/* 가격 섹션 */}
                  <ProductPrice
                    price={item.price}
                    discount={item.discount}
                    size="md"
                    quantity={item.quantity}
                    priceOffset={item.priceOffset}
                    className="text-right"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* 비어있을 때 (참고용) */}
          <EmptyCart isEmpty={cartProducts.length === 0} />
        </div>

        <CartSummary selectedProducts={selectedProducts} />
      </div>
    </div>
  );
};

export default CartPage;
