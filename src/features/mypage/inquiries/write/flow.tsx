'use client';

import { useState } from 'react';
import type { InquiryType, InquiryWriteViewModel } from '@/domains/inquiry';
import { MypageInquiryForm } from '../form';
import { MypageInquiryWriteSubmissionResult } from './submission-result';

interface MypageInquiryWriteFlowProps {
  viewModel: InquiryWriteViewModel;
  returnHref: string;
  onCreateInquiry: (input: {
    type: InquiryType;
    title: string;
    content: string;
    orderId: string;
    orderItemId: string;
    productId: string;
  }) => Promise<boolean>;
}

export function MypageInquiryWriteFlow({
  viewModel,
  returnHref,
  onCreateInquiry,
}: MypageInquiryWriteFlowProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return isSubmitted ? (
    <MypageInquiryWriteSubmissionResult />
  ) : (
    <MypageInquiryForm
      viewModel={viewModel}
      returnHref={returnHref}
      onSubmitted={async input => {
        const isCreated = await onCreateInquiry(input);
        if (isCreated) {
          setIsSubmitted(true);
        }
        return isCreated;
      }}
    />
  );
}
