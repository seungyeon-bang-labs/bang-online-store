import type { OrderStatusHistoryViewModel } from '@/domains/order';

interface MypageOrderDetailStatusHistoryProps {
  histories: readonly OrderStatusHistoryViewModel[];
}

export function MypageOrderDetailStatusHistory({
  histories,
}: MypageOrderDetailStatusHistoryProps) {
  return (
    <section className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="border-b border-zinc-200 p-4 md:p-5">
        <h3 className="font-black text-black">주문 처리 내역</h3>
      </header>
      <ol className="p-4 md:p-5">
        {histories.map((history, index) => (
          <li
            key={history.id}
            className="relative grid grid-cols-[0.75rem_minmax(0,1fr)] gap-3"
          >
            {index < histories.length - 1 ? (
              <span
                className="absolute top-[18px] -bottom-1.5 left-[5px] w-0.5 bg-zinc-200"
                aria-hidden="true"
              />
            ) : null}
            <span
              className={`z-10 mt-1.5 size-3 shrink-0 rounded-full border-2 ${
                history.isCurrent
                  ? 'border-black bg-black'
                  : 'border-zinc-300 bg-white'
              }`}
              aria-hidden="true"
            />
            <div
              className={`grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_max-content] items-center gap-4 ${
                index < histories.length - 1 ? 'pb-5' : ''
              }`}
            >
              <p
                className={
                  history.isCurrent
                    ? 'font-black text-black'
                    : 'font-bold text-zinc-500'
                }
              >
                {history.label}
              </p>
              <time className="whitespace-nowrap text-left text-xs font-medium text-zinc-400 sm:text-sm">
                {history.occurredAt}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
