import { CheckCircle2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';

interface MypageInquiryWriteSubmissionResultProps {
  returnHref: string;
}

export function MypageInquiryWriteSubmissionResult({
  returnHref,
}: MypageInquiryWriteSubmissionResultProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center p-5 text-center">
      <CheckCircle2 className="size-9 text-black" aria-hidden="true" />
      <p className="mt-4 text-base font-black text-black">
        문의 작성 내용을 확인했습니다.
      </p>
      <p className="mt-2 text-sm font-medium text-zinc-500">
        데모 환경에서는 문의 내역에 저장되지 않습니다.
      </p>
      <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2">
        <ButtonLink
          href={returnHref}
          variant="outline"
          className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-white hover:text-black"
        >
          돌아가기
        </ButtonLink>
        <ButtonLink
          href="/mypage/inquiries?type=all&status=all&page=1"
          className="w-full rounded-sm bg-black font-bold text-white hover:bg-zinc-800"
        >
          문의 내역
        </ButtonLink>
      </div>
    </div>
  );
}
