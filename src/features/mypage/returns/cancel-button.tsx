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
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import {
  MYPAGE_ACTION_CLASS_NAME,
  MYPAGE_DIALOG_CLASS_NAME,
} from '@/features/mypage/common/styles';

interface MypageClaimCancelButtonProps {
  claimId: string;
  cancelOrderClaimAction: (claimId: string) => Promise<boolean>;
}

export function MypageClaimCancelButton({
  claimId,
  cancelOrderClaimAction,
}: MypageClaimCancelButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  async function cancelCurrentClaim() {
    setIsCancelling(true);

    try {
      const isCancelled = await cancelOrderClaimAction(claimId);

      if (isCancelled) {
        toast.success('교환·반품 신청이 취소되었습니다.', {
          position: 'bottom-center',
        });
      } else {
        toast.error('교환·반품 신청을 취소하지 못했습니다.', {
          position: 'bottom-center',
        });
      }
    } catch {
      toast.error('교환·반품 신청을 취소하지 못했습니다.', {
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
          신청 취소
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className={MYPAGE_DIALOG_CLASS_NAME.content}>
        <AlertDialogHeader>
          <AlertDialogTitle className={MYPAGE_DIALOG_CLASS_NAME.title}>
            교환·반품 신청을 취소할까요?
          </AlertDialogTitle>
          <AlertDialogDescription className={MYPAGE_DIALOG_CLASS_NAME.description}>
            신청을 취소하면 교환·반품 요청을 철회합니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={MYPAGE_DIALOG_CLASS_NAME.footer}>
          <AlertDialogCancel className={MYPAGE_DIALOG_CLASS_NAME.cancel}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={cancelCurrentClaim}
            disabled={isCancelling}
            className={MYPAGE_DIALOG_CLASS_NAME.confirm}
          >
            {isCancelling ? '취소 처리 중' : '신청 취소'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
