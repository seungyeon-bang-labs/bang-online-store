import { ButtonLink } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface Tab {
  label: string;
  urlQuery: string;
}

interface TabsProps {
  tabs: Tab[];
  queryKey: string;
  currentTab: string;
  mobileLayout?: 'scroll' | 'fill';
  className?: string;
}

export function Tabs({
  tabs,
  queryKey,
  currentTab,
  mobileLayout = 'scroll',
  className,
}: TabsProps) {
  return (
    <div
      className={cn(
        'flex gap-2 whitespace-nowrap scrollbar-hide py-2',
        mobileLayout === 'fill' ? 'overflow-hidden md:overflow-x-auto' : 'overflow-x-auto',
        className,
      )}
    >
      {tabs.map((tab, i) => {
        const isActive = tab.urlQuery === currentTab;

        return (
            <ButtonLink
              key={i}
              href={`?${queryKey}=${tab.urlQuery}`}
              scroll={false}
              size={mobileLayout === 'fill' ? 'sm' : 'lg'}
              variant="outline"
              className={cn(
                mobileLayout === 'fill' && 'min-w-0 flex-1 px-2 md:flex-none md:h-10 md:px-6',
                isActive
                  ? 'bg-black text-white hover:bg-black hover:text-white'
                  : 'bg-white text-black',
              )}
            >
              {tab.label}
            </ButtonLink>
        );
      })}
    </div>
  );
}
