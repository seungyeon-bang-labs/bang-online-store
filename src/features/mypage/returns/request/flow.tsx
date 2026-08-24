'use client';

import { useState } from 'react';
import type { OrderClaimRequestType } from '@/domains/order/claim/domain';
import type { OrderClaimRequestViewModel } from '@/domains/order/claim/view-model';
import { MypageClaimRequestForm } from './form';
import { MypageClaimRequestSubmissionResult } from './submission-result';

interface MypageClaimRequestFlowProps {
  claimRequest: OrderClaimRequestViewModel;
}

export function MypageClaimRequestFlow({
  claimRequest,
}: MypageClaimRequestFlowProps) {
  const [submittedType, setSubmittedType] =
    useState<OrderClaimRequestType | null>(null);

  if (submittedType) {
    return <MypageClaimRequestSubmissionResult type={submittedType} />;
  }

  return (
    <MypageClaimRequestForm
      claimRequest={claimRequest}
      onSubmitted={setSubmittedType}
    />
  );
}
