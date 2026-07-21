import type { InquiryViewModel } from '@/domains/inquiry';
import { MypageStatusBadge } from './mypage-status-badge';

export function MypageInquiryList({
  inquiries,
}: {
  inquiries: readonly InquiryViewModel[];
}) {
  return (
    <div className="space-y-4">
      {inquiries.map(inquiry => (
        <article
          key={inquiry.id}
          className="rounded-md border border-zinc-300 bg-white p-5 md:p-6"
        >
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-zinc-500">
                {inquiry.typeLabel}
              </span>
              <MypageStatusBadge {...inquiry.status} />
            </div>
            <p className="text-xs font-medium text-zinc-400">
              {inquiry.createdAt}
            </p>
          </header>

          <div className="pt-4">
            <h3 className="font-black text-black">{inquiry.title}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-600">
              {inquiry.content}
            </p>

            {inquiry.answerContent && inquiry.answeredAt ? (
              <section className="mt-5 rounded-md bg-zinc-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-black">답변</h4>
                  <p className="text-xs font-medium text-zinc-400">
                    {inquiry.answeredAt}
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-700">
                  {inquiry.answerContent}
                </p>
              </section>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
