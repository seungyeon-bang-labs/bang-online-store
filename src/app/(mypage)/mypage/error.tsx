'use client';

import { MypageErrorState, MypagePageLayout } from '@/features/mypage/common';

interface MypageErrorProps {
  reset: () => void;
}

function MypageError({ reset }: MypageErrorProps) {
  return (
    <MypagePageLayout fill>
      <MypageErrorState onRetry={reset} />
    </MypagePageLayout>
  );
}

export default MypageError;
