import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { CS_MENU } from '@/lib/navigation';

export function NoticeAndFAQPreview() {
  return (
    <div className="grid md:grid-cols-2 gap-12 mb-16">
      {/* 공지사항 */}
      <div>
        <div className="flex justify-between items-end mb-6 pb-2 border-b-2 border-black">
          <h2 className=" text-2xl font-black">실시간 주요 공지사항</h2>
          <Link
            href={CS_MENU.find(item => item.href === '/cs/notice')?.href || '#'}
            className=" font-bold text-gray-400 hover:underline"
          >
            더 보기 +
          </Link>
        </div>
        <ul className="divide-y divide-gray-200">
          {[
            '[안내] 설 연휴 배송 및 고객센터 휴무 안내',
            '[점검] 결제 시스템 서버 점검 안내 (02/15)',
            '신규 멤버십 등급 혜택 변경 안내',
            '신규 멤버십 등급 혜택 변경 안내',
            '신규 멤버십 등급 혜택 변경 안내',
          ].map((text, i) => (
            <li
              key={i}
              className="py-4 text-sm hover:pl-2 transition-all cursor-pointer text-gray-600 hover:text-black"
            >
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* 자주 묻는 질문 */}
      <div>
        <div className="flex justify-between items-end mb-6 pb-2 border-b-2 border-black">
          <h2 className="text-2xl font-black ">가장 많이 묻는 질문</h2>
          <Link
            href={CS_MENU.find(item => item.href === '/cs/faq')?.href || '#'}
            className=" font-bold text-gray-400 hover:underline"
          >
            더 보기 +
          </Link>
        </div>
        <div className="space-y-3">
          {[
            '배송은 얼마나 걸리나요?',
            '주문 취소는 어떻게 하나요?',
            '비회원 주문 조회 방법',
            '비회원 주문 조회 방법',
            '비회원 주문 조회 방법',
          ].map((q, i) => (
            <div
              key={i}
              className="p-4 border border-gray-200 flex justify-between items-center cursor-pointer hover:border-black transition-colors rounded-md"
            >
              <span className="text-sm font-medium text-gray-700">
                <span className="font-black mr-2 text-black">Q.</span> {q}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
