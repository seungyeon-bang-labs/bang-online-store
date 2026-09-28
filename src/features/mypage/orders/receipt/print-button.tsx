'use client';

import { MYPAGE_ACTION_CLASS_NAME } from '@/features/mypage/common/styles';

import { Printer } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export function MypageOrderReceiptPrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={`print-receipt-action ${MYPAGE_ACTION_CLASS_NAME.outline}`}
      onClick={() => window.print()}
    >
      <Printer className="size-4" aria-hidden="true" />
      인쇄하기
    </Button>
  );
}
