import { ReactNode } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import { ChevronDown } from 'lucide-react'; // 클릭 가능함을 알리는 아이콘

export interface Sibling {
  label: string;
  href: string;
}

interface PageTitleProps {
  parent?: {
    label: string;
    href: string;
  };
  current: string;
  siblings?: Sibling[]; // siblings 객체 배열 (undefined 허용)
  children?: ReactNode;
  className?: string;
}

export function PageTitle({
  parent,
  current,
  siblings,
  children,
  className,
}: PageTitleProps) {
  const hasSiblings = siblings && siblings.length > 0;

  return (
    <div
      className={cn(
        'flex items-end justify-between border-b-4 border-black pb-5 mb-10',
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList className="text-3xl gap-3 items-center md:text-4xl">
            {parent && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href={parent.href}
                    className="text-gray-300 hover:text-gray-600 transition-colors font-black tracking-tight"
                  >
                    {parent.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-black font-black">
                  /
                </BreadcrumbSeparator>
              </>
            )}

            <BreadcrumbItem>
              {hasSiblings ? (
                <DropdownMenu modal={false}>
                  {/* 타이틀 넓이를 드롭다운이 따라가게 하기 위해 w-full 또는 inline-block 설정 */}
                  <DropdownMenuTrigger className="flex items-center gap-1 text-black font-black tracking-tight cursor-pointer outline-none group">
                    <BreadcrumbPage className="text-black font-black tracking-tight whitespace-nowrap">
                      {current}
                    </BreadcrumbPage>
                    <ChevronDown 
                      size={28} 
                      strokeWidth={4} 
                      className="text-black transition-transform duration-200 group-data-[state=open]:rotate-180" 
                    />
                  </DropdownMenuTrigger>

                  {/* min-w-[var(--radix-dropdown-menu-trigger-width)]: 
                    트리거(타이틀)의 넓이를 그대로 드롭다운 넓이로 할당하는 핵심 속성 
                  */}
                  <DropdownMenuContent
                    align="start"
                    sideOffset={15}
                    className="min-w-(--radix-dropdown-menu-trigger-width) p-1.5 rounded-xl border-2 border-black bg-white shadow-none animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="flex flex-col gap-1">
                      {siblings.map(sibling => (
                        <DropdownMenuItem
                          key={sibling.href}
                          asChild
                          className="p-0 focus:bg-transparent"
                        >
                          <Link
                            href={sibling.href}
                            className={cn(
                              'w-full cursor-pointer px-4 py-2.5 rounded-lg transition-all text-center',
                              'text-xl font-black tracking-tighter ',
                              current === sibling.label
                                ? 'bg-black text-white data-highlighted:bg-black data-highlighted:text-white'
                                : 'bg-white text-black data-highlighted:bg-gray-200 data-highlighted:text-black',
                            )}
                          >
                            {sibling.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <BreadcrumbPage className="text-black font-black tracking-tight">
                  {current}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}
