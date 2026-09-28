import { MypageSubmissionResult } from '@/features/mypage/common/submission-result';
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
    <MypageSubmissionResult
      title={`배송지가 ${isEditMode ? '수정' : '등록'}되었습니다.`}
      action={{ href: returnHref, label: '배송지 관리' }}
    />
  );
}
