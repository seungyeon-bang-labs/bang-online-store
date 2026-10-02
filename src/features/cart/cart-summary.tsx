import { Button } from '@/shared/components/ui/button';
import { useMemo, useTransition } from 'react';
import { CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCartStore } from '@/domains/cart';
import { createDemoOrderFromCart } from '@/app/(storefront)/cart/actions';

interface SelectedProduct {
  id: string;
  productId: number;
  name: string;
  price: number;
  discount: number;
  quantity: number;
  priceOffset: number;
}

interface CartSummaryProps {
  selectedProducts: SelectedProduct[];
}

export function CartSummary({ selectedProducts }: CartSummaryProps) {
  const router = useRouter();
  const clearCart = useCartStore(state => state.clearCart);
  const [isPending, startTransition] = useTransition();
  const orderSummary = useMemo(() => {
    const itemCount = selectedProducts.reduce(
      (total, item) => total + item.quantity,
      0,
    );
    const subtotal = selectedProducts.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const discountAmount = selectedProducts.reduce((total, item) => {
      if (item.discount <= 0) return total;
      const discountPerItem = Math.round(item.price * (item.discount / 100));
      return total + discountPerItem * item.quantity;
    }, 0);
    const shippingFee = 0;
    const optionsTotal = selectedProducts.reduce(
      (total, item) => total + item.priceOffset * item.quantity,
      0,
    );
    const total = Math.max(0, subtotal - discountAmount + shippingFee + optionsTotal);

    return { itemCount, subtotal, discountAmount, shippingFee, total, optionsTotal };
  }, [selectedProducts]);

  const handleCreateOrder = () => {
    if (selectedProducts.length === 0) {
      toast.error('주문할 상품을 선택해 주세요.', { position: 'bottom-center' });
      return;
    }

    startTransition(async () => {
      try {
        const orderId = await createDemoOrderFromCart(
          selectedProducts.map(product => ({
            productId: product.productId,
            variantId: product.id,
            quantity: product.quantity,
          })),
        );
        clearCart();
        toast.success('데모 주문을 생성했습니다.', { position: 'bottom-center' });
        router.push(`/mypage/orders/${orderId}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : '주문 생성에 실패했습니다.',
          { position: 'bottom-center' },
        );
      }
    });
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-[var(--mobile-bottom-nav-height)] z-30 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500">총 결제 금액</p>
            <p className="truncate text-base font-black tracking-tight text-black">
              {orderSummary.total.toLocaleString()}원
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            disabled={isPending || selectedProducts.length === 0}
            className="min-w-28 font-black"
            onClick={handleCreateOrder}
          >
            {isPending ? '주문 생성 중' : '주문하기'}
          </Button>
        </div>
      </div>

      <div className="sticky top-40 hidden transition-all duration-300 md:block">
      <div className="bg-black text-white p-8 rounded-md">
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b border-gray-800 pb-4">
          결제정보
        </h2>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center font-bold">
            <span className="text-gray-400">상품수</span>
            <span>{orderSummary.itemCount}개</span>
          </div>
          <div className="flex justify-between items-center font-bold">
            <span className="text-gray-400">상품 금액</span>
            <span>{orderSummary.subtotal.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between items-center font-bold">
            <span className="text-gray-400">상품 할인</span>
            {orderSummary.discountAmount > 0 ? (
              <span className="text-red-500">
                -{orderSummary.discountAmount.toLocaleString()}원
              </span>
            ) : (
              <span>0원</span>
            )}
          </div>
          <div className="flex justify-between items-center font-bold">
            <span className="text-gray-400">옵션 추가 금액</span>
            <span>{orderSummary.optionsTotal.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between items-center font-bold">
            <span className="text-gray-400">배송비</span>
            {orderSummary.shippingFee > 0 ? (
              <span>{orderSummary.shippingFee.toLocaleString()}원</span>
            ) : (
              <span>무료 배송</span>
            )}
          </div>
          <div className="pt-6 border-t border-gray-800 flex justify-between items-end">
            <span className="font-black uppercase">총 결제 금액</span>
            <span className="text-lg font-black tracking-tighter">
              {orderSummary.total.toLocaleString()}원
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            size="xl"
            disabled={isPending || selectedProducts.length === 0}
            className="w-full text-black font-black flex items-center justify-center gap-3 text-lg tracking-widest"
            onClick={handleCreateOrder}
          >
            <CreditCard className="size-6" />
            {isPending ? '주문 생성 중' : '주문하기'}
          </Button>
        </div>
      </div>
      </div>
    </>
  );
}
