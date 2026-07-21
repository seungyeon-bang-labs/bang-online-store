import { ButtonLink } from '@/components/ui/button';
import { filterMenuByAuth, MOBILE_FOOTER_MENU } from '@/lib/navigation';

export function MobileBottomNav() {
  const isLoggedIn = false;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe">
      <div className="mx-auto w-full max-w-6xl px-3 py-2">
        <div className="flex items-center justify-around">
          {filterMenuByAuth(MOBILE_FOOTER_MENU, isLoggedIn).map(item => (
            <ButtonLink
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-gray-500 hover:text-white hover:bg-gray-900/90"
              size="icon-lg"
              variant="ghost"
            >
              {item.icon && <item.icon className="size-6" />}
              <span className="text-[10px] font-medium tracking-wide">
                {item.name}
              </span>
            </ButtonLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
