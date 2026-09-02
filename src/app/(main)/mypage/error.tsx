'use client';

import { MypageErrorState } from '@/features/mypage/common';

interface MypageErrorProps {
  reset: () => void;
}

function MypageError({ reset }: MypageErrorProps) {
  return <MypageErrorState onRetry={reset} />;
}

export default MypageError;
