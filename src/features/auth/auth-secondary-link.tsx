import { ButtonLink } from '@/shared/components/ui/button';

type AuthSecondaryLinkProps = {
  variant?: 'login' | 'password';
};

export function AuthSecondaryLink({
  variant = 'login',
}: AuthSecondaryLinkProps) {
  const isLogin = variant === 'login';

  return (
    <div className="flex justify-end">
      <ButtonLink
        href={isLogin ? '/find-password' : '/signup'}
        variant="link"
        size="xs"
        className="text-gray-500 hover:text-black text-sm"
      >
        {isLogin ? '비밀번호 찾기' : '회원가입'}
      </ButtonLink>
    </div>
  );
}
