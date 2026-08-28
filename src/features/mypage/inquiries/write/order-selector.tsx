'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { InputError } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type {
  InquiryWriteOrderItemOptionViewModel,
  InquiryWriteOrderOptionViewModel,
} from '@/domains/inquiry';
import { MypageInquirySelectorDialogContent } from './selector-dialog-content';
import { MypageInquirySelectorSearchInput } from './selector-search-input';

interface MypageInquiryWriteOrderSelectorProps {
  orders: readonly InquiryWriteOrderOptionViewModel[];
  isOrderItemRequired: boolean;
  selectedOrderId: string;
  selectedOrderItemId: string;
  initialOrderIdForItemSelection?: string;
  error?: string;
  isReadOnly?: boolean;
  onOrderChange: (orderId: string) => void;
  onOrderItemContextChange: (context: {
    orderId: string;
    orderItemId: string;
  }) => void;
}

export function MypageInquiryWriteOrderSelector({
  orders,
  isOrderItemRequired,
  selectedOrderId,
  selectedOrderItemId,
  initialOrderIdForItemSelection,
  error,
  isReadOnly = false,
  onOrderChange,
  onOrderItemContextChange,
}: MypageInquiryWriteOrderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderIdForItemSelection, setOrderIdForItemSelection] = useState<
    string | null
  >(null);
  const selectedOrder = orders.find(order => order.id === selectedOrderId);
  const selectedOrderItem = selectedOrder?.items.find(
    item => item.id === selectedOrderItemId,
  );
  const hasSelectedContext = Boolean(
    selectedOrder && (!isOrderItemRequired || selectedOrderItem),
  );
  const itemSelectionOrder = orders.find(
    order => order.id === orderIdForItemSelection,
  );
  const filteredOrders = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();

    if (!normalizedSearchTerm) return orders;

    return orders.filter(
      order =>
        order.orderNumber.toLocaleLowerCase().includes(normalizedSearchTerm) ||
        order.items.some(item =>
          item.productName.toLocaleLowerCase().includes(normalizedSearchTerm),
        ),
    );
  }, [orders, searchTerm]);

  function resetDialog() {
    setSearchTerm('');
    setOrderIdForItemSelection(null);
  }

  function openOrderSelector() {
    setSearchTerm('');
    setOrderIdForItemSelection(
      isOrderItemRequired ? (initialOrderIdForItemSelection ?? null) : null,
    );
    setIsOpen(true);
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) resetDialog();
  }

  function selectOrder(order: InquiryWriteOrderOptionViewModel) {
    if (!isOrderItemRequired) {
      onOrderChange(order.id);
      handleOpenChange(false);
      return;
    }

    if (order.items.length === 1) {
      onOrderItemContextChange({
        orderId: order.id,
        orderItemId: order.items[0].id,
      });
      handleOpenChange(false);
      return;
    }

    setSearchTerm('');
    setOrderIdForItemSelection(order.id);
  }

  function selectOrderItem(orderItem: InquiryWriteOrderItemOptionViewModel) {
    if (!itemSelectionOrder) return;

    onOrderItemContextChange({
      orderId: itemSelectionOrder.id,
      orderItemId: orderItem.id,
    });
    handleOpenChange(false);
  }

  return (
    <div>
      <label htmlFor="inquiry-order-selector" className="font-bold text-black">
        {isOrderItemRequired ? '주문 상품 선택' : '주문 선택'}{' '}
        <span className="ml-1 text-sm font-medium text-zinc-500">(필수)</span>
      </label>

      {hasSelectedContext && selectedOrder ? (
        <button
          id="inquiry-order-selector"
          type="button"
          disabled={isReadOnly}
          onClick={openOrderSelector}
          className="mt-2 flex w-full items-center gap-3 rounded-sm border border-zinc-300 bg-white p-3 text-left transition-colors hover:bg-zinc-50 focus-visible:border-black focus-visible:outline-none disabled:cursor-default disabled:hover:bg-white"
        >
          {isOrderItemRequired && selectedOrderItem ? (
            <>
              <OrderItemThumbnail item={selectedOrderItem} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-black">
                  {selectedOrderItem.productName}
                </p>
                <p className="mt-0.5 text-sm font-medium text-zinc-500">
                  {selectedOrderItem.optionLabel} · {selectedOrderItem.quantity}개
                </p>
                <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">
                  {selectedOrder.orderNumber} · {selectedOrder.orderedAt}
                </p>
              </div>
            </>
          ) : (
            <>
              <OrderThumbnail order={selectedOrder} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-black">
                  {selectedOrder.orderNumber}
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-zinc-600">
                  {selectedOrder.productSummary}
                </p>
                <p className="mt-0.5 text-xs font-medium text-zinc-500">
                  {selectedOrder.orderedAt}
                </p>
              </div>
            </>
          )}
          {!isReadOnly ? (
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 text-zinc-500"
              strokeWidth={2}
            />
          ) : null}
        </button>
      ) : (
        <button
          id="inquiry-order-selector"
          type="button"
          data-invalid={Boolean(error)}
          onClick={openOrderSelector}
          className="mt-2 flex h-10 w-full items-center justify-between rounded-sm border border-zinc-300 bg-white px-3 text-left text-sm font-medium text-zinc-500 hover:border-black focus-visible:border-black focus-visible:outline-none data-[invalid=true]:border-red-500"
        >
          {isOrderItemRequired
            ? '주문 상품을 선택해 주세요'
            : '주문을 선택해 주세요'}
          <ChevronRight className="size-4 text-zinc-500" strokeWidth={2} />
        </button>
      )}
      <InputError message={error} />

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <MypageInquirySelectorDialogContent>
          {itemSelectionOrder ? (
            <OrderItemSelectionContent
              order={itemSelectionOrder}
              onBack={() => setOrderIdForItemSelection(null)}
              onSelect={selectOrderItem}
            />
          ) : (
            <>
              <DialogHeader className="shrink-0 border-b border-zinc-300 px-5 py-5 text-center sm:text-center">
                <DialogTitle className="font-black text-black">
                  주문 선택
                </DialogTitle>
              </DialogHeader>
              <div className="shrink-0 p-5 pb-0">
                <MypageInquirySelectorSearchInput
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  placeholder="주문번호 또는 상품명을 입력해 주세요"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {filteredOrders.length > 0 ? (
                  <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
                    {filteredOrders.map(order => (
                      <li key={order.id}>
                        <button
                          type="button"
                          onClick={() => selectOrder(order)}
                          className="flex w-full items-center gap-3 py-3 text-left hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none"
                        >
                          <OrderThumbnail order={order} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-black">
                              {order.orderNumber}
                            </p>
                            <p className="mt-0.5 truncate text-sm font-medium text-zinc-700">
                              {order.productSummary}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-zinc-500">
                              {order.orderedAt}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="flex h-full items-center justify-center text-center text-sm font-medium text-zinc-500">
                    검색 결과가 없습니다.
                  </p>
                )}
              </div>
            </>
          )}
        </MypageInquirySelectorDialogContent>
      </Dialog>
    </div>
  );
}

function OrderItemSelectionContent({
  order,
  onBack,
  onSelect,
}: {
  order: InquiryWriteOrderOptionViewModel;
  onBack: () => void;
  onSelect: (orderItem: InquiryWriteOrderItemOptionViewModel) => void;
}) {
  return (
    <>
      <DialogHeader className="relative shrink-0 border-b border-zinc-300 px-5 py-5 text-center sm:text-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="주문 선택으로 돌아가기"
          className="absolute top-1/2 left-5 flex -translate-y-1/2 items-center gap-1 text-sm font-bold text-zinc-600 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          <ChevronLeft className="size-4" strokeWidth={2} />
          주문 선택
        </button>
        <DialogTitle className="font-black text-black">
          주문 상품 선택
        </DialogTitle>
      </DialogHeader>
      <div className="shrink-0 p-5 pb-0">
        <div className="flex items-center gap-3 rounded-sm border border-zinc-300 bg-white p-3">
          <OrderThumbnail order={order} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-black">{order.orderNumber}</p>
            <p className="mt-0.5 truncate text-sm font-medium text-zinc-700">
              {order.productSummary}
            </p>
            <p className="mt-0.5 text-xs font-medium text-zinc-500">{order.orderedAt}</p>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
          {order.items.map(item => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full items-center gap-3 py-3 text-left hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none"
              >
                <OrderItemThumbnail item={item} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-black">
                    {item.productName}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-zinc-500">
                    {item.optionLabel} · {item.quantity}개
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function OrderThumbnail({
  order,
}: {
  order: InquiryWriteOrderOptionViewModel;
}) {
  return <Thumbnail src={order.representativeThumbnailUrl} />;
}

function OrderItemThumbnail({
  item,
}: {
  item: InquiryWriteOrderItemOptionViewModel;
}) {
  return <Thumbnail src={item.thumbnailUrl} />;
}

function Thumbnail({
  src,
}: {
  src: string | null;
}) {
  const sizeClassName = 'size-14';

  return (
    <div
      className={`relative ${sizeClassName} shrink-0 overflow-hidden rounded-sm bg-zinc-100`}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="56px"
          className="object-cover"
        />
      ) : null}
    </div>
  );
}
