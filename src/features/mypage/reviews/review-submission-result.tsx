import { CheckCircle2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { REVIEW_LIST_BUTTON_LABEL } from './review-form.constants';

interface ReviewSubmissionResultProps {
  message: string;
  listHref: string;
}

export function ReviewSubmissionResult({
  message,
  listHref,
}: ReviewSubmissionResultProps) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center text-center">
      <CheckCircle2 className="size-9 text-black" aria-hidden="true" />
      <p className="mt-4 text-base font-black text-black">{message}</p>
      <ButtonLink
        href={listHref}
        variant="outline"
        className="mt-6 rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
      >
        {REVIEW_LIST_BUTTON_LABEL}
      </ButtonLink>
    </div>
  );
}
