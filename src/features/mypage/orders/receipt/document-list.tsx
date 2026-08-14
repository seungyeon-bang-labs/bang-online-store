import Link from 'next/link';
import { ChevronRight, FileText } from 'lucide-react';
import type { MypageOrderReceiptDocumentListViewModel } from '@/domains/mypage';

interface MypageOrderReceiptDocumentListProps {
  receiptDocumentList: MypageOrderReceiptDocumentListViewModel;
}

export function MypageOrderReceiptDocumentList({
  receiptDocumentList,
}: MypageOrderReceiptDocumentListProps) {
  const { orderNumber, documents } = receiptDocumentList;

  return (
    <section className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="border-b border-zinc-200 p-4 md:p-5">
        <div className="flex items-center gap-3 text-sm">
          <p className="shrink-0 font-bold text-zinc-500">주문 번호</p>
          <p className="min-w-0 break-all font-black text-black">{orderNumber}</p>
        </div>
      </header>
      <ul className="divide-y divide-zinc-200">
        {documents.map(document => (
          <li key={document.type}>
            <Link
              href={document.href}
              className="flex items-center gap-3 p-4 outline-none transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 md:p-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-zinc-100 text-zinc-700">
                <FileText className="size-[18px]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-black text-black">{document.title}</span>
                <span className="mt-0.5 block text-sm font-medium text-zinc-500">
                  {document.description}
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-zinc-400" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-zinc-200 bg-zinc-50 p-4 text-xs font-medium leading-relaxed text-zinc-500 md:px-5">
        발급 문서는 데모 환경에서 확인하는 용도이며 실제 결제·세무 증빙으로
        사용할 수 없습니다.
      </div>
    </section>
  );
}
