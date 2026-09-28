'use client';

import { useState } from 'react';
import type {
  InquiryEditViewModel,
  InquiryTextInput,
  InquiryUpdateResult,
} from '@/domains/inquiry';
import { MypageFormUnavailable } from '@/features/mypage/common';
import { MypageInquiryForm } from '../form';
import { MypageInquiryEditSubmissionResult } from './submission-result';
import { INQUIRY_EDIT_UNAVAILABLE } from './constants';

interface MypageInquiryEditFlowProps {
  viewModel: InquiryEditViewModel;
  returnHref: string;
  updateInquiryAction: (
    inquiryId: string,
    input: InquiryTextInput,
  ) => Promise<InquiryUpdateResult>;
}

export function MypageInquiryEditFlow({
  viewModel,
  returnHref,
  updateInquiryAction,
}: MypageInquiryEditFlowProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

  return isUnavailable ? (
    <MypageFormUnavailable
      {...INQUIRY_EDIT_UNAVAILABLE}
      action={{ href: returnHref, label: '1:1 문의 내역으로' }}
    />
  ) : isSubmitted ? (
    <MypageInquiryEditSubmissionResult returnHref={returnHref} />
  ) : (
    <MypageInquiryForm
      viewModel={viewModel}
      returnHref={returnHref}
      mode="edit"
      initialValues={viewModel.inquiry}
      onSubmitted={async values => {
        const result = await updateInquiryAction(
          viewModel.inquiry.id,
          values,
        );
        if (result === 'updated') setIsSubmitted(true);
        if (result === 'answered') setIsUnavailable(true);

        return result === 'updated';
      }}
    />
  );
}
