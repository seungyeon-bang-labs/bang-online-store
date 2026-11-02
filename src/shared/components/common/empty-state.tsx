import { LucideIcon } from 'lucide-react';
import { ButtonLink } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    href: string;
    label: string;
  };
  // One filled action per screen; pass outline where several empty states share a screen.
  actionVariant?: 'default' | 'outline';
  className?: string;
  fill?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionVariant = 'default',
  className,
  fill = false,
}: EmptyStateProps) {
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
          variant={actionVariant}
          className="mt-6"
        >
          {action.label}
        </ButtonLink>
      )}
    </div>
  );
}
