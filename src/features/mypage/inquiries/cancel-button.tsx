'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface MypageInquiryCancelButtonProps {
  inquiryId: string;
  cancelInquiryAction: (inquiryId: string) => Promise<boolean>;
}

export function MypageInquiryCancelButton({
  inquiryId,
  cancelInquiryAction,
}: MypageInquiryCancelButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  async function cancelCurrentInquiry() {
    setIsCancelling(true);

    try {
      const isCancelled = await cancelInquiryAction(inquiryId);
      if (isCancelled) {
        toast.success('문의 취소가 완료되었습니다.', {
          position: 'bottom-center',
        });
      } else {
        toast.error('문의 취소를 완료하지 못했습니다.', {
          position: 'bottom-center',
        });
      }
    } catch {
      toast.error('문의 취소를 완료하지 못했습니다.', {
        position: 'bottom-center',
      });
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full rounded-sm border-red-200 font-bold text-red-700 shadow-none hover:border-red-600 hover:bg-red-50 hover:text-red-700"
        >
          문의 취소
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-xs rounded-sm border-zinc-300 bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black text-black">
            문의 취소
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-medium leading-relaxed text-zinc-500">
            문의 취소 후에는 수정하거나 답변을 받을 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel className="flex-1 rounded-sm border-zinc-300 font-bold">
            닫기
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={cancelCurrentInquiry}
            disabled={isCancelling}
            className="flex-1 rounded-sm border-red-600 bg-red-600 font-bold text-white hover:bg-red-700"
          >
            {isCancelling ? '취소 처리 중' : '문의 취소'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
