'use client';

import { useState } from 'react';
import type {
  OrderCancellationPreviewViewModel,
  OrderCancellationSubmitInput,
} from '@/domains/order/cancellation';
import { MypageOrderCancellationForm } from './form';
import { MypageOrderCancellationSubmissionResult } from './submission-result';

interface MypageOrderCancellationFlowProps {
  preview: OrderCancellationPreviewViewModel;
  returnHref: string;
  onSubmitCancellation: (
    orderId: string,
    orderItemId: string,
    input: OrderCancellationSubmitInput,
  ) => Promise<boolean>;
}

export function MypageOrderCancellationFlow({
  preview,
  returnHref,
  onSubmitCancellation,
}: MypageOrderCancellationFlowProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return isSubmitted ? (
    <MypageOrderCancellationSubmissionResult />
  ) : (
    <MypageOrderCancellationForm
      preview={preview}
      returnHref={returnHref}
      onSubmitted={async input => {
        const isCancelled = await onSubmitCancellation(
          preview.orderId,
          preview.orderItemId,
          input,
        );
        if (isCancelled) setIsSubmitted(true);
        return isCancelled;
      }}
    />
  );
}
