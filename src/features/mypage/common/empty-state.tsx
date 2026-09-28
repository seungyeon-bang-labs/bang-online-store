import { MYPAGE_ACTION_CLASS_NAME } from '@/features/mypage/common/styles';
import { LucideIcon } from 'lucide-react';
import { ButtonLink } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface MypageEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    href: string;
    label: string;
  };
  className?: string;
  fill?: boolean;
}

export function MypageEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  fill = false,
}: MypageEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-white px-6 py-16 text-center',
        fill && 'md:h-full md:flex-1',
        className,
      )}
    >
      {Icon && <Icon className="size-8 text-zinc-300" />}
      <p className={cn('text-base font-black text-black', Icon && 'mt-5')}>
        {title}
      </p>
      <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-zinc-500">
        {description}
      </p>
      {action && (
        <ButtonLink
          href={action.href}
          variant="outline"
          className={`mt-6 ${MYPAGE_ACTION_CLASS_NAME.outline}`}
        >
          {action.label}
        </ButtonLink>
      )}
    </div>
  );
}
