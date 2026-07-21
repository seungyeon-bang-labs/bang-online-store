import { ButtonLink } from '@/components/ui/button';
import { CS_MENU } from '@/lib/navigation';

export function QuickMenu() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
      {CS_MENU.map((item, idx) => (
        <ButtonLink
          key={idx}
          href={item.href}
          variant="ghost"
          size="xl"
          className="flex h-full flex-col items-center justify-center p-8 bg-white hover:bg-black hover:text-white transition-all duration-300 border-2 border-black rounded-md group"
        >
          <div className="mb-1 transition-colors">
            {item.icon && <item.icon className="size-7" />}
          </div>
          <span className="font-bold text-base tracking-widest">{item.name}</span>
        </ButtonLink>
      ))}
    </div>
  );
}
