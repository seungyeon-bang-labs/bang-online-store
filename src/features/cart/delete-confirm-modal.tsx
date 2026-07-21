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
import { X } from 'lucide-react';

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  type?: 'item' | 'selected';
  disableTrigger?: boolean; 
}

export function DeleteConfirmModal({
  onConfirm,
  type = 'item',
  disableTrigger = false,
}: DeleteConfirmModalProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {type === 'item' ? (
          <button className="text-gray-300 hover:text-black transition-colors cursor-pointer">
            <X className="size-5" />
          </button>
        ) : (
          <button disabled={disableTrigger} className="text-sm font-bold text-gray-400 hover:text-black transition-colors disabled:opacity-40 disabled:hover:text-gray-400 cursor-pointer">
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
          <AlertDialogCancel className="flex-1 rounded-md font-bold border-gray-200 cursor-pointer">
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 rounded-md font-bold bg-black hover:bg-gray-800 text-white border-none cursor-pointer"
          >
            삭제하기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
