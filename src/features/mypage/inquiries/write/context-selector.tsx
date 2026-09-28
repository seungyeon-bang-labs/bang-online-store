'use client';

import type {
  InquiryContextRequirement,
  ResolvedInquiryWriteContext,
  InquiryWriteSelectionOptionsViewModel,
} from '@/domains/inquiry';
import { MypageInquiryWriteOrderSelector } from './order-selector';
import { MypageInquiryWriteProductSelector } from './product-selector';

interface MypageInquiryWriteContextSelectorProps {
  requirement: InquiryContextRequirement | null;
  selectionOptions: InquiryWriteSelectionOptionsViewModel;
  resolvedContext: ResolvedInquiryWriteContext;
  error?: string;
  errorId?: string;
  isReadOnly?: boolean;
  onOrderChange: (orderId: string) => void;
  onOrderItemContextChange: (context: {
    orderId: string;
    orderItemId: string;
  }) => void;
  onProductChange: (productId: string) => void;
}

export function MypageInquiryWriteContextSelector({
  requirement,
  selectionOptions,
  resolvedContext,
  error,
  errorId,
  isReadOnly = false,
  onOrderChange,
  onOrderItemContextChange,
  onProductChange,
}: MypageInquiryWriteContextSelectorProps) {
  if (!requirement || requirement === 'none') return null;

  const isOrderItemRequired = requirement === 'order-item';

  return (
    <section
      className="px-4 pb-4 md:px-5 md:pb-5"
      aria-label="문의 대상 선택"
    >
      {requirement === 'product' ? (
        <MypageInquiryWriteProductSelector
          products={selectionOptions.products}
          selectedProductId={resolvedContext.productId}
          error={error}
          errorId={errorId}
          isReadOnly={isReadOnly}
          onProductChange={onProductChange}
        />
      ) : (
        <div>
          <MypageInquiryWriteOrderSelector
            orders={selectionOptions.orders}
            isOrderItemRequired={isOrderItemRequired}
            selectedOrderId={resolvedContext.orderId}
            selectedOrderItemId={resolvedContext.orderItemId}
            initialOrderIdForItemSelection={resolvedContext.orderIdForItemSelection}
            error={error}
            errorId={errorId}
            isReadOnly={isReadOnly}
            onOrderChange={onOrderChange}
            onOrderItemContextChange={onOrderItemContextChange}
          />
        </div>
      )}
    </section>
  );
}
