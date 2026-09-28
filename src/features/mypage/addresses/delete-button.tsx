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
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';

interface MypageAddressDeleteButtonProps {
  canDelete: boolean;
}

interface MypageAddressDeleteDialogProps {
  canDelete: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MypageAddressDeleteDialog({
  canDelete,
  open,
  onOpenChange,
}: MypageAddressDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteAddress() {
    setIsDeleting(true);

    try {
      toast.success('배송지를 삭제했습니다.', { position: 'bottom-center' });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={MYPAGE_DIALOG_CLASS_NAME.content}>
        {canDelete ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className={MYPAGE_DIALOG_CLASS_NAME.title}>
                배송지를 삭제할까요?
              </AlertDialogTitle>
              <AlertDialogDescription className={MYPAGE_DIALOG_CLASS_NAME.description}>
                삭제한 배송지는 복구할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className={MYPAGE_DIALOG_CLASS_NAME.footer}>
              <AlertDialogCancel className={MYPAGE_DIALOG_CLASS_NAME.cancel}>
                취소
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteAddress}
                disabled={isDeleting}
                className={MYPAGE_DIALOG_CLASS_NAME.confirm}
              >
                {isDeleting ? '삭제 처리 중' : '배송지 삭제'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className={MYPAGE_DIALOG_CLASS_NAME.title}>
                기본 배송지는 삭제할 수 없습니다.
              </AlertDialogTitle>
              <AlertDialogDescription className={MYPAGE_DIALOG_CLASS_NAME.description}>
                다른 배송지를 기본 배송지로 설정한 후 삭제해 주세요.
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

export function MypageAddressDeleteButton({
  canDelete,
}: MypageAddressDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`w-full ${MYPAGE_ACTION_CLASS_NAME.dangerOutline}`}
      >
        삭제
      </Button>
      <MypageAddressDeleteDialog
        canDelete={canDelete}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
