import Link from 'next/link';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { BUSINESS_INFO } from '@/shared/constants/business-info';
import { CS_MENU, PC_MAIN_MENU } from '@/shared/lib/navigation';
import { LogoWithIcon } from './logo';

const footerLinkClassName =
  'inline-flex min-h-11 items-center rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring';

function BusinessDetails() {
  return (
    <dl className="flex flex-col gap-x-5 gap-y-2 text-xs leading-relaxed text-muted-foreground md:flex-row md:flex-wrap">
      {[
        ['상호', BUSINESS_INFO.companyName],
        ['대표자', BUSINESS_INFO.representativeName],
        ['사업자등록번호', BUSINESS_INFO.registrationNumber],
        ['통신판매업 신고번호', BUSINESS_INFO.mailOrderRegistrationNumber],
      ].map(([label, value]) => (
        <div key={label} className="flex flex-wrap gap-x-2">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-border bg-muted/40">
      <div className="mx-auto w-full max-w-6xl px-5 pt-10 pb-6 md:px-8 md:pt-14 md:pb-8">
        <div className="grid gap-9 pb-8 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12 md:pb-12">
          <div>
            <Link
              href="/"
              aria-label={`${BUSINESS_INFO.brandName} 홈`}
              className="inline-flex min-h-11 items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <LogoWithIcon size="sm" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              일상에 더하는 나만의 스타일.
              <br />
              새로운 취향을 BANG에서 만나보세요.
            </p>

            <div className="mt-6 border-t border-border pt-5 md:mt-8">
              <h2 className="text-xs font-semibold text-foreground">고객센터</h2>
              <a
                href={`tel:${BUSINESS_INFO.customerServicePhone}`}
                className="inline-flex min-h-11 items-center rounded-sm text-2xl font-bold tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                {BUSINESS_INFO.customerServicePhone}
              </a>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                평일 10:00–17:00 · 점심 12:00–13:00
                <br />
                주말 및 공휴일 휴무
              </p>
              <a
                href={`mailto:${BUSINESS_INFO.customerServiceEmail}`}
                className={`${footerLinkClassName} mt-1 break-all`}
              >
                {BUSINESS_INFO.customerServiceEmail}
                <ArrowUpRight aria-hidden="true" className="ml-1.5 size-3.5 shrink-0" />
              </a>
            </div>
          </div>

          <nav
            aria-label="푸터 메뉴"
            className="grid grid-cols-2 gap-5 border-t border-border pt-6 md:col-span-2 md:gap-12 md:border-0 md:pt-1"
          >
            <div>
              <h2 className="mb-3 text-xs font-semibold tracking-widest text-foreground">
                SHOP
              </h2>
              <ul>
                {PC_MAIN_MENU.map(item => (
                  <li key={item.href}>
                    <Link href={item.href} className={footerLinkClassName}>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-semibold tracking-widest text-foreground">
                SUPPORT
              </h2>
              <ul>
                {CS_MENU.map(item => (
                  <li key={item.href}>
                    <Link href={item.href} className={footerLinkClassName}>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/cs"
                className={`${footerLinkClassName} mt-2 gap-1.5 font-medium text-foreground`}
              >
                고객센터 바로가기
                <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
              </Link>
            </div>
          </nav>
        </div>

        <div className="border-t border-border pt-4 md:pt-6">
          <details className="group md:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-sm text-xs font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
              {BUSINESS_INFO.companyName} 사업자 정보
              <ChevronDown
                aria-hidden="true"
                className="size-4 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>
            <div className="pt-2 pb-4">
              <BusinessDetails />
            </div>
          </details>
          <div className="hidden md:block">
            <BusinessDetails />
          </div>
          <p className="mt-4 text-[11px] leading-5 text-muted-foreground md:mt-5">
            &copy; {new Date().getFullYear()} BANG. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
