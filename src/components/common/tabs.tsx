import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface Tab {
  label: string;
  urlQuery: string;
}

interface TabsProps {
  tabs: Tab[];
  queryKey: string;
  currentTab: string;
  className?: string;
}

export function Tabs({ tabs, queryKey, currentTab, className }: TabsProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide py-2',
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
              size="lg"
              variant="outline"
              className={
                isActive
                  ? 'bg-black text-white hover:bg-black hover:text-white'
                  : 'bg-white text-black'
              }
            >
              {tab.label}
            </ButtonLink>
        );
      })}
    </div>
  );
}
