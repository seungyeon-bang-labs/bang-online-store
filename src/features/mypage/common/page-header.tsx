import { ButtonLink } from '@/shared/components/ui/button';
import { MYPAGE_ACTION_CLASS_NAME, MYPAGE_TYPOGRAPHY } from './styles';

interface MypagePageHeaderProps {
  title: string;
  action?: {
    href: string;
    label: string;
    mobilePlacement?: 'page' | 'header';
  };
}

export function MypagePageHeader({
  title,
  action,
}: MypagePageHeaderProps) {
  return (
    <>
      <h2 className="sr-only md:hidden">{title}</h2>
      <div className="hidden flex-col gap-4 md:flex md:flex-row md:items-end md:justify-between">
        <h2 className={MYPAGE_TYPOGRAPHY.pageTitle}>
          {title}
        </h2>
        {action && (
          <ButtonLink
            href={action.href}
            size="lg"
            className={`w-full md:w-auto ${MYPAGE_ACTION_CLASS_NAME.primary}`}
          >
            {action.label}
          </ButtonLink>
        )}
      </div>
      {action && action.mobilePlacement !== 'header' && (
        <ButtonLink
          href={action.href}
          size="lg"
          className={`h-12 w-full md:hidden ${MYPAGE_ACTION_CLASS_NAME.primary}`}
        >
          {action.label}
        </ButtonLink>
      )}
    </>
  );
}
