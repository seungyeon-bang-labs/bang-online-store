import type { ReactNode } from 'react';
import { DialogContent } from '@/shared/components/ui/dialog';

interface MypageInquirySelectorDialogContentProps {
  children: ReactNode;
}

export function MypageInquirySelectorDialogContent({
  children,
}: MypageInquirySelectorDialogContentProps) {
  return (
    <DialogContent className="flex !inset-0 !h-dvh !max-h-none !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden !rounded-none !border-0 bg-white p-0 md:!inset-auto md:!top-1/2 md:!left-1/2 md:!h-[min(34rem,calc(100dvh-2rem))] md:!max-h-[calc(100dvh-2rem)] md:!w-full md:!max-w-xl md:!-translate-x-1/2 md:!-translate-y-1/2 md:!rounded-sm md:!border md:border-zinc-300 [&>button]:top-2 [&>button]:right-2 [&>button]:flex [&>button]:size-10 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-none [&>button]:border-0 [&>button]:bg-transparent [&>button]:opacity-100 [&>button]:shadow-none [&>button]:focus:ring-0 [&>button]:focus:ring-offset-0 [&>button]:focus-visible:outline-2 [&>button]:focus-visible:outline-offset-2 [&>button]:focus-visible:outline-black [&>button>svg]:size-5 [&>button]:data-[state=open]:bg-transparent">
      {children}
    </DialogContent>
  );
}
