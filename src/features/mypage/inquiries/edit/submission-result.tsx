import { CheckCircle2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';

interface MypageInquiryEditSubmissionResultProps {
  returnHref: string;
}

export function MypageInquiryEditSubmissionResult({
  returnHref,
}: MypageInquiryEditSubmissionResultProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center p-5 text-center">
      <CheckCircle2 className="size-9 text-black" aria-hidden="true" />
      <p className="mt-4 text-base font-black text-black">
        문의 수정 내용을 확인했습니다.
      </p>
      <p className="mt-2 text-sm font-medium text-zinc-500">
        데모 환경에서는 문의 내역에 반영되지 않습니다.
      </p>
      <ButtonLink
        href={returnHref}
        variant="outline"
        className="mt-6 rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
      >
        문의 내역으로
      </ButtonLink>
    </div>
  );
}
