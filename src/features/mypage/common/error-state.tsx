import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MypageErrorStateProps {
  onRetry: () => void;
}

export function MypageErrorState({ onRetry }: MypageErrorStateProps) {
  return (
    <section
      role="alert"
      className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-white px-6 py-16 text-center md:h-full md:min-h-0"
    >
      <AlertCircle className="size-8 text-zinc-400" aria-hidden="true" />
      <p className="mt-5 text-base font-black text-black">
        정보를 불러오지 못했습니다.
      </p>
      <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-zinc-500">
        잠시 후 다시 시도해 주세요.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onRetry}
        className="mt-6 rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
      >
        다시 시도
      </Button>
    </section>
  );
}
