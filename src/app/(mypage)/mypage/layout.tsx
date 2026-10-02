import { PageTitle } from '@/shared/components/common/page-title';
import MypageNavigation from '@/features/mypage/navigation/mypage-navigation';

interface MypageLayoutProps {
  children: React.ReactNode;
}

function MypageLayout({ children }: MypageLayoutProps) {
  return (
    <div className="w-full flex-1 bg-zinc-50 md:flex-none">
      <div
        className="w-full max-w-6xl mx-auto px-4 py-5 md:mb-10 md:px-8 md:py-10"
        data-mypage-layout
      >
        <div className="hidden md:block" data-mypage-page-title>
          <PageTitle current="마이페이지" />
        </div>

        <div className="flex flex-col gap-5 md:gap-8 md:flex-row">
          <div className="contents" data-mypage-navigation>
            <MypageNavigation />
          </div>

          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default MypageLayout;
