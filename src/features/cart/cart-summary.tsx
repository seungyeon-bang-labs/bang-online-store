import { Button } from '@/components/ui/button';
import { useMemo } from 'react';
import { CreditCard } from 'lucide-react';

interface SelectedProduct {
  id: string;
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

  return (
    <div className="sticky top-40 transition-all duration-300">
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
            <span className="text-gray-400">할인 금액</span>
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
            variant="outline"
            size="xl"
            className="w-full text-black font-black flex items-center justify-center gap-3 text-lg tracking-widest cursor-pointer"
          >
            <CreditCard className="size-6" /> 주문하기
          </Button>
        </div>
      </div>
    </div>
  );
}
