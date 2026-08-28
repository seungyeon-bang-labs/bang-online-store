'use client';

import { useState } from 'react';
import type {
  InquiryEditViewModel,
  InquiryTextInput,
} from '@/domains/inquiry';
import { MypageInquiryForm } from '../form';
import { MypageInquiryEditSubmissionResult } from './submission-result';

interface MypageInquiryEditFlowProps {
  viewModel: InquiryEditViewModel;
  returnHref: string;
  updateInquiryAction: (
    inquiryId: string,
    input: InquiryTextInput,
  ) => Promise<boolean>;
}

export function MypageInquiryEditFlow({
  viewModel,
  returnHref,
  updateInquiryAction,
}: MypageInquiryEditFlowProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return isSubmitted ? (
    <MypageInquiryEditSubmissionResult returnHref={returnHref} />
  ) : (
    <MypageInquiryForm
      viewModel={viewModel}
      returnHref={returnHref}
      mode="edit"
      initialValues={viewModel.inquiry}
      onSubmitted={async values => {
        const isUpdated = await updateInquiryAction(
          viewModel.inquiry.id,
          values,
        );
        if (isUpdated) setIsSubmitted(true);

        return isUpdated;
      }}
    />
  );
}
