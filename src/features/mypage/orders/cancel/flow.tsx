'use client';

import { useState } from 'react';
import type { OrderCancellationPreviewViewModel } from '@/domains/order/cancellation';
import { MypageOrderCancellationForm } from './form';
import { MypageOrderCancellationSubmissionResult } from './submission-result';

interface MypageOrderCancellationFlowProps {
  preview: OrderCancellationPreviewViewModel;
  returnHref: string;
}

export function MypageOrderCancellationFlow({
  preview,
  returnHref,
}: MypageOrderCancellationFlowProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return isSubmitted ? (
    <MypageOrderCancellationSubmissionResult orderId={preview.orderId} />
  ) : (
    <MypageOrderCancellationForm
      preview={preview}
      returnHref={returnHref}
      onSubmitted={() => setIsSubmitted(true)}
    />
  );
}
