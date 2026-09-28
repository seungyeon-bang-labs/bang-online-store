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

interface MypageReviewDeleteButtonProps {
  reviewId: string;
  canDelete: boolean;
  deleteAvailableAt: string;
  deleteReviewAction: (reviewId: string) => Promise<boolean>;
}

export function MypageReviewDeleteButton({
  reviewId,
  canDelete,
  deleteAvailableAt,
  deleteReviewAction,
}: MypageReviewDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteCurrentReview() {
    setIsDeleting(true);

    try {
      const canDelete = await deleteReviewAction(reviewId);

      if (canDelete) {
        toast.success('리뷰를 삭제했습니다.', { position: 'bottom-center' });
      } else {
        toast.error('리뷰를 삭제하지 못했습니다.', {
          position: 'bottom-center',
        });
      }
    } catch {
      toast.error('리뷰를 삭제하지 못했습니다.', {
        position: 'bottom-center',
      });
    } finally {
      setIsDeleting(false);
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
          삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className={MYPAGE_DIALOG_CLASS_NAME.content}>
        {canDelete ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className={MYPAGE_DIALOG_CLASS_NAME.title}>
                리뷰를 삭제할까요?
              </AlertDialogTitle>
              <AlertDialogDescription className={MYPAGE_DIALOG_CLASS_NAME.description}>
                삭제한 리뷰는 복구할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className={MYPAGE_DIALOG_CLASS_NAME.footer}>
              <AlertDialogCancel className={MYPAGE_DIALOG_CLASS_NAME.cancel}>
                취소
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteCurrentReview}
                disabled={isDeleting}
                className={MYPAGE_DIALOG_CLASS_NAME.confirm}
              >
                {isDeleting ? '삭제 처리 중' : '리뷰 삭제'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className={MYPAGE_DIALOG_CLASS_NAME.title}>
                아직 리뷰를 삭제할 수 없습니다.
              </AlertDialogTitle>
              <AlertDialogDescription className={MYPAGE_DIALOG_CLASS_NAME.description}>
                리뷰 작성 후 7일이 지난 {deleteAvailableAt}부터 삭제할 수 있습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className={MYPAGE_DIALOG_CLASS_NAME.footer}>
              <AlertDialogCancel className={MYPAGE_DIALOG_CLASS_NAME.dismiss}>
                확인
              </AlertDialogCancel>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
