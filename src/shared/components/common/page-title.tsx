import { ReactNode } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb';
import { cn } from '@/shared/lib/utils';
import {
  CategorySwitcher,
  type CategorySibling,
} from './category-switcher';

export type Sibling = CategorySibling;

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
                    className="text-black hover:text-gray-600 transition-colors font-black tracking-tight"
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
                <CategorySwitcher current={current} siblings={siblings} />
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
