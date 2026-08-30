import { CheckCircle2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import type { MypageAddressFormMode } from './types';

interface MypageAddressSubmissionResultProps {
  mode: MypageAddressFormMode;
  returnHref: string;
}

export function MypageAddressSubmissionResult({
  mode,
  returnHref,
}: MypageAddressSubmissionResultProps) {
  const isEditMode = mode === 'edit';

  return (
    <section className="flex min-h-72 flex-col items-center justify-center rounded-md border border-zinc-300 bg-white p-5 text-center">
      <CheckCircle2 className="size-9 text-black" aria-hidden="true" />
      <p className="mt-4 text-base font-black text-black">
        배송지 {isEditMode ? '수정' : '등록'} 내용을 확인했습니다.
      </p>
      <p className="mt-2 text-sm font-medium text-zinc-500">
        데모 환경에서는 배송지 목록에 반영되지 않습니다.
      </p>
      <ButtonLink
        href={returnHref}
        variant="outline"
        className="mt-6 rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
      >
        배송지 관리로
      </ButtonLink>
    </section>
  );
}
