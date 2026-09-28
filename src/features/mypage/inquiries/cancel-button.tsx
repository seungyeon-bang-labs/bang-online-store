'use client';

import {
  MYPAGE_ACTION_CLASS_NAME,
  MYPAGE_DIALOG_CLASS_NAME,
} from '@/features/mypage/common/styles';

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
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';

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
          className={`w-full ${MYPAGE_ACTION_CLASS_NAME.dangerOutline}`}
        >
          문의 취소
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className={MYPAGE_DIALOG_CLASS_NAME.content}>
        <AlertDialogHeader>
          <AlertDialogTitle className={MYPAGE_DIALOG_CLASS_NAME.title}>
            문의 취소할까요?
          </AlertDialogTitle>
          <AlertDialogDescription className={MYPAGE_DIALOG_CLASS_NAME.description}>
            문의 취소 후에는 수정하거나 답변을 받을 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={MYPAGE_DIALOG_CLASS_NAME.footer}>
          <AlertDialogCancel className={MYPAGE_DIALOG_CLASS_NAME.cancel}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={cancelCurrentInquiry}
            disabled={isCancelling}
            className={MYPAGE_DIALOG_CLASS_NAME.confirm}
          >
            {isCancelling ? '취소 처리 중' : '문의 취소'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
