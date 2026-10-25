'use client';

import { useState } from 'react';
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
import { X } from 'lucide-react';

interface DeleteConfirmModalProps {
  onConfirm: () => boolean | Promise<boolean>;
  type?: 'item' | 'selected';
  disableTrigger?: boolean;
}

export function DeleteConfirmModal({
  onConfirm,
  type = 'item',
  disableTrigger = false,
}: DeleteConfirmModalProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={next => { if (!pending) setOpen(next); }}>
      <AlertDialogTrigger asChild>
        {type === 'item' ? (
          <button
            disabled={disableTrigger || pending}
            aria-label="장바구니 상품 삭제"
            className="-mr-2 -mt-1 inline-flex size-8 shrink-0 items-center justify-center text-gray-400 transition-colors hover:text-black"
          >
            <X className="size-5" />
          </button>
        ) : (
          <button disabled={disableTrigger || pending} className="text-sm font-bold text-gray-400 hover:text-black transition-colors disabled:opacity-40 disabled:hover:text-gray-400">
            선택 삭제
          </button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-md max-w-xs!">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black text-xl">
            {type === 'item'
              ? '상품 삭제'
              : '선택 상품 삭제'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-medium text-gray-500">
            {type === 'item'
              ? '상품을 삭제하시겠습니까?'
              : '선택한 상품을 모두 삭제하시겠습니까?'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 mt-4">
          <AlertDialogCancel disabled={pending} className="flex-1 rounded-md font-bold border-gray-200">
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending || disableTrigger}
            onClick={async event => {
              event.preventDefault();
              if (pending || disableTrigger) return;
              setPending(true);
              try { if (await onConfirm()) setOpen(false); }
              finally { setPending(false); }
            }}
            className="flex-1 rounded-md font-bold bg-black hover:bg-gray-800 text-white border-none"
          >
            삭제하기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
