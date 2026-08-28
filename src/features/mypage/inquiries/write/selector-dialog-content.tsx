import type { ReactNode } from 'react';
import { DialogContent } from '@/components/ui/dialog';

interface MypageInquirySelectorDialogContentProps {
  children: ReactNode;
}

export function MypageInquirySelectorDialogContent({
  children,
}: MypageInquirySelectorDialogContentProps) {
  return (
    <DialogContent className="flex h-[min(34rem,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-sm border-zinc-300 bg-white p-0 sm:max-w-xl [&>button]:top-5 [&>button]:right-5 [&>button]:rounded-none [&>button]:border-0 [&>button]:bg-transparent [&>button]:opacity-100 [&>button]:shadow-none [&>button]:focus:ring-0 [&>button]:focus:ring-offset-0 [&>button]:focus-visible:outline-2 [&>button]:focus-visible:outline-offset-2 [&>button]:focus-visible:outline-black [&>button]:data-[state=open]:bg-transparent">
      {children}
    </DialogContent>
  );
}
