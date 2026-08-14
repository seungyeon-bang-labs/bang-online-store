import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { SiInstagram, SiYoutube, SiFacebook } from "react-icons/si";
import { BUSINESS_INFO } from '@/shared/constants/business-info';

export function Footer() {
  return (
    <footer className="w-full bg-zinc-100 dark:bg-zinc-950 ">
      <div className="mx-auto max-w-6xl px-8 py-20">
        {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-16">
          {/* 왼쪽: 브랜드 & 소셜 */}
          <div className="lg:col-span-4 space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-3 text-black dark:text-white">
                {BUSINESS_INFO.brandName}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm">
                모던하고 미니멀한 라이프스타일을 제안하는 남성복 브랜드입니다.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-gray-500" />
                <span className="font-semibold text-black dark:text-white">
                  {BUSINESS_INFO.customerServicePhone}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {BUSINESS_INFO.customerServiceEmail}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 ml-7">
                평일 10:00-18:00 (점심 12:00-13:00)
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="#"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all"
                aria-label="Instagram"
              >
                <SiInstagram size={18} />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all"
                aria-label="Youtube"
              >
                <SiYoutube size={18} />
              </Link>
              <Link
                href="#"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all"
                aria-label="Facebook"
              >
                <SiFacebook size={18} />
              </Link>
            </div>
          </div>

          {/* 오른쪽: 링크 섹션 */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-12">
            {/* 쇼핑 가이드 */}
            <div>
              <h4 className="text-sm font-bold mb-5 text-black dark:text-white">
                쇼핑 가이드
              </h4>
              <ul className="space-y-3">
                {[
                  { label: '주문/배송', href: '/shipping' },
                  { label: '반품/교환', href: '/refund' },
                  { label: '사이즈 안내', href: '/size' },
                  { label: '상품 문의', href: '/inquiry' },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 고객 지원 */}
            <div>
              <h4 className="text-sm font-bold mb-5 text-black dark:text-white">
                고객 지원
              </h4>
              <ul className="space-y-3">
                {[
                  { label: '공지사항', href: '/notice' },
                  { label: '자주묻는질문', href: '/faq' },
                  { label: '1:1 문의', href: '/contact' },
                  { label: '매장 안내', href: '/stores' },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* 회사 정보 */}
            <div>
              <h4 className="text-sm font-bold mb-5 text-black dark:text-white">
                회사 정보
              </h4>
              <ul className="space-y-3">
                {[
                  { label: '브랜드 소개', href: '/brand' },
                  { label: '이용약관', href: '/terms' },
                  { label: '개인정보처리방침', href: '/privacy' },
                  { label: '제휴 문의', href: '/partnership' },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-200 dark:border-zinc-800 mb-8" />

        {/* 하단: 사업자 정보 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-2 text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
            <p>
              {BUSINESS_INFO.companyName} | 대표자: {BUSINESS_INFO.representativeName} | 사업자등록번호:{' '}
              {BUSINESS_INFO.registrationNumber}{' '}
              <Link
                href="#"
                className="underline hover:text-gray-700 dark:hover:text-gray-300"
              >
                [확인]
              </Link>
            </p>
            <p>통신판매업: {BUSINESS_INFO.mailOrderRegistrationNumber}</p>
            <p>서울특별시 강남구 테헤란로 123</p>
            <p>개인정보보호책임자: 홍길동 (help@bang.com)</p>
          </div>

          <div className="lg:text-right">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              &copy; 2026 BANG. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
