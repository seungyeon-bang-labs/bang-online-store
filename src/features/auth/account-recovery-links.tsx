import { ButtonLink } from '@/shared/components/ui/button';

type AccountRecoveryLinksProps = {
  variant?: 'login' | 'password';
};

const recoveryLinkMap: Record<
  NonNullable<AccountRecoveryLinksProps['variant']>,
  Array<{ href: string; label: string }>
> = {
  login: [{ href: '/find-password', label: '비밀번호 찾기' }],
  password: [{ href: '/signup', label: '회원가입' }],
};

function AccountRecoveryLinks({
  variant = 'login',
}: AccountRecoveryLinksProps) {
  const linkItems = recoveryLinkMap[variant];

  return (
    <div className="flex justify-end">
      {linkItems.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && <span className="text-gray-500 text-sm">|</span>}
          <ButtonLink
            href={item.href}
            variant="link"
            size="xs"
            className="text-gray-500 hover:text-black text-sm"
          >
            {item.label}
          </ButtonLink>
        </div>
      ))}
    </div>
  );
}

export { AccountRecoveryLinks };
