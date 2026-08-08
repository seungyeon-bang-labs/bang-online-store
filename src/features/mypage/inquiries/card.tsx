import { Button } from '@/components/ui/button';
import type { InquiryViewModel } from '@/domains/inquiry';
import { MypageStatusBadge } from '../common/status-badge';
import { MypageInquiryContext } from './context';

interface MypageInquiryCardProps {
  inquiry: InquiryViewModel;
}

export function MypageInquiryCard({ inquiry }: MypageInquiryCardProps) {
  return (
    <article className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 p-4 md:p-5">
        <div className="flex min-w-0 items-center gap-2">
          <MypageStatusBadge
            label={inquiry.typeLabel}
            tone="neutral"
            size="responsive"
          />
          <MypageStatusBadge {...inquiry.status} size="responsive" />
        </div>
        <p className="shrink-0 whitespace-nowrap text-right text-xs font-medium text-zinc-400 sm:text-sm">
          {inquiry.createdAt}
        </p>
      </header>

      <div className="p-4 md:p-5">
        {inquiry.context ? (
          <MypageInquiryContext context={inquiry.context} />
        ) : null}
        <div className={inquiry.context ? 'mt-4 px-4' : 'px-4'}>
          <h3 className="font-black text-black">{inquiry.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-700">
            {inquiry.content}
          </p>
        </div>

        {inquiry.answerContent && inquiry.answeredAt ? (
          <section className="mt-4 rounded-sm bg-zinc-100 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-black text-black">답변</h4>
              <p className="text-xs font-medium text-zinc-400">
                {inquiry.answeredAt}
              </p>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-700">
              {inquiry.answerContent}
            </p>
          </section>
        ) : null}
        {inquiry.actions.canCancel || inquiry.actions.canEdit ? (
          <div
            className={`mt-3 grid gap-2 ${
              inquiry.actions.canCancel && inquiry.actions.canEdit
                ? 'grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {inquiry.actions.canCancel ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-sm border-red-200 font-bold text-red-700 shadow-none hover:border-red-600 hover:bg-red-50 hover:text-red-700"
              >
                문의 취소
              </Button>
            ) : null}
            {inquiry.actions.canEdit ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
              >
                수정
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
