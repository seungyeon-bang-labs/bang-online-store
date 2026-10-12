'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import type { TermDetailViewModel } from '@/domains/terms/view-model';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { TermContent } from './term-content';

interface TermDetailDialogProps {
  termId: string;
  label: string;
  disabled?: boolean;
}

export function TermDetailDialog({
  termId,
  label,
  disabled,
}: TermDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState<TermDetailViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTerm(null);
      setError('');
      setIsLoading(true);
    }
    setOpen(nextOpen);
  };

  const handleRetry = () => {
    setError('');
    setIsLoading(true);
    setRetryCount(value => value + 1);
  };

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    let ignore = false;

    const loadTerm = async () => {
      try {
        const response = await fetch(
          `/api/terms/${encodeURIComponent(termId)}`,
          {
            cache: 'no-store',
            signal: controller.signal,
          },
        );

        if (ignore) return;

        if (!response.ok) {
          setError(
            response.status === 404
              ? '현재 확인할 수 없는 약관입니다.'
              : '약관을 불러오지 못했습니다. 다시 시도해주세요.',
          );
          return;
        }

        const data: { term?: TermDetailViewModel } = await response.json();
        if (ignore) return;

        if (
          !data.term ||
          typeof data.term.title !== 'string' ||
          typeof data.term.content !== 'string' ||
          typeof data.term.version !== 'string' ||
          typeof data.term.effectiveDateLabel !== 'string'
        ) {
          throw new Error('Invalid term response');
        }

        setTerm(data.term);
      } catch {
        if (!ignore) {
          setError('약관을 불러오지 못했습니다. 다시 시도해주세요.');
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    void loadTerm();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [open, termId, retryCount]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`${label} 자세히 보기`}
          className="ml-auto shrink-0 text-sm underline underline-offset-4 disabled:opacity-50"
        >
          자세히 보기
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="left-0 top-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none md:left-1/2 md:top-1/2 md:h-[min(720px,85dvh)] md:max-w-3xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:border"
        onOpenAutoFocus={event => {
          event.preventDefault();
          titleRef.current?.focus();
        }}
      >
        <header className="grid min-h-14 shrink-0 grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center border-b py-2 md:grid-cols-[minmax(0,1fr)_auto] md:gap-4 md:px-6 md:py-4">
          <DialogTitle
            ref={titleRef}
            tabIndex={-1}
            className="col-start-2 row-start-1 px-2 text-center text-base leading-6 outline-none md:col-start-1 md:px-0 md:text-left md:text-xl"
          >
            {term?.title ?? label}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-md"
              aria-label="약관 닫기"
              className="col-start-1 row-start-1 ml-2 md:col-start-2 md:ml-0 md:w-auto md:px-3"
            >
              <ChevronLeft className="size-5 md:hidden" aria-hidden="true" />
              <X className="hidden size-4 md:block" aria-hidden="true" />
              <span className="hidden md:inline">닫기</span>
            </Button>
          </DialogClose>
        </header>
        <div
          aria-busy={isLoading}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6"
        >
          {isLoading ? (
            <p role="status" className="py-8 text-sm text-muted-foreground">
              약관을 불러오는 중입니다.
            </p>
          ) : error ? (
            <div className="space-y-4 py-4">
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
              <Button type="button" variant="outline" onClick={handleRetry}>
                다시 시도
              </Button>
            </div>
          ) : term ? (
            <TermContent term={term} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
