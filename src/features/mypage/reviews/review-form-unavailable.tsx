import { CircleAlert } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import type { ReviewFormMode } from '@/domains/activity/view-model';
import { MypageEmptyState } from '@/features/mypage/common';
import {
  REVIEW_FORM_COPY,
  REVIEW_LIST_BUTTON_LABEL,
} from './review-form.constants';

interface ReviewFormUnavailableProps {
  mode: ReviewFormMode;
}

export function ReviewFormUnavailable({ mode }: ReviewFormUnavailableProps) {
  const copy = REVIEW_FORM_COPY[mode];

  return (
    <div className="space-y-5">
      <MypageEmptyState
        icon={CircleAlert}
        title={copy.unavailableTitle}
        description={copy.unavailableDescription}
      />
      <div className="flex justify-center">
        <ButtonLink
          href={copy.listHref}
          variant="outline"
          className="rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
        >
          {REVIEW_LIST_BUTTON_LABEL}
        </ButtonLink>
      </div>
    </div>
  );
}
