import { CircleAlert, type LucideIcon } from 'lucide-react';
import { ButtonLink } from '@/shared/components/ui/button';
import { MYPAGE_ACTION_CLASS_NAME } from './styles';
import { MypageCard } from './card';

interface MypageFormUnavailableProps {
  title: string;
  description: string;
  action: {
    href: string;
    label: string;
  };
  icon?: LucideIcon;
}

export function MypageFormUnavailable({
  title,
  description,
  action,
  icon: Icon = CircleAlert,
}: MypageFormUnavailableProps) {
  return (
    <MypageCard.Body className="p-0">
      <div className="flex min-h-72 flex-col items-center justify-center p-4 text-center md:p-5">
        <Icon className="size-9 text-zinc-400" aria-hidden="true" />
        <p className="mt-4 text-base font-black text-black">{title}</p>
        <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-zinc-500">
          {description}
        </p>
        <ButtonLink
          href={action.href}
          variant="outline"
          className={`mt-6 ${MYPAGE_ACTION_CLASS_NAME.outline}`}
        >
          {action.label}
        </ButtonLink>
      </div>
    </MypageCard.Body>
  );
}
