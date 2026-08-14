'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MypageOrderReceiptPrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="print-receipt-action rounded-sm border-zinc-300 font-bold shadow-none"
      onClick={() => window.print()}
    >
      <Printer className="size-4" aria-hidden="true" />
      인쇄하기
    </Button>
  );
}
