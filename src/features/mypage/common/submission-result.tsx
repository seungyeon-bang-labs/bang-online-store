import { CheckCircle2, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ButtonLink } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { MypageCard } from './card';
import { MYPAGE_ACTION_CLASS_NAME, MYPAGE_TYPOGRAPHY } from './styles';

interface MypageSubmissionResultBaseProps {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
}

type MypageSubmissionResultProps = MypageSubmissionResultBaseProps & (
  | {
    action: { href: string; label: string };
    actions?: never;
  }
  | {
    action?: never;
    actions: ReactNode;
  }
);

export function MypageSubmissionResult({
  icon: Icon = CheckCircle2,
  title,
  description,
  action,
  actions,
}: MypageSubmissionResultProps) {
  return (
    <MypageCard.Body className="p-0">
      <div className="flex min-h-72 flex-col items-center justify-center p-4 text-center md:p-5">
        <Icon className="size-9 text-black" aria-hidden="true" />
        <p role="status" className={cn('mt-4', MYPAGE_TYPOGRAPHY.cardTitle)}>
          {title}
        </p>
        {description && (
          <p className="mt-2 text-sm font-medium text-zinc-500">{description}</p>
        )}
        <div className="mt-6 flex w-full max-w-sm justify-center">
          {action ? (
            <ButtonLink
              href={action.href}
              variant="outline"
              className={MYPAGE_ACTION_CLASS_NAME.outline}
            >
              {action.label}
            </ButtonLink>
          ) : (
            actions
          )}
        </div>
      </div>
    </MypageCard.Body>
  );
}
