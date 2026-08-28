'use client';

import { useState } from 'react';
import type { InquiryWriteViewModel } from '@/domains/inquiry';
import { MypageInquiryForm } from '../form';
import { MypageInquiryWriteSubmissionResult } from './submission-result';

interface MypageInquiryWriteFlowProps {
  viewModel: InquiryWriteViewModel;
  returnHref: string;
}

export function MypageInquiryWriteFlow({
  viewModel,
  returnHref,
}: MypageInquiryWriteFlowProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return isSubmitted ? (
    <MypageInquiryWriteSubmissionResult returnHref={returnHref} />
  ) : (
    <MypageInquiryForm
      viewModel={viewModel}
      returnHref={returnHref}
      onSubmitted={() => {
        setIsSubmitted(true);
        return true;
      }}
    />
  );
}
