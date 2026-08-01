import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OrderItemActionsViewModel } from '@/domains/order';

interface MypageOrderItemActionsProps {
  actions: OrderItemActionsViewModel;
  productName: string;
}

export function MypageOrderItemActions({
  actions,
  productName,
}: MypageOrderItemActionsProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        className="w-full rounded-sm border-zinc-300 font-bold shadow-none disabled:opacity-100"
      >
        {actions.primary.label}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        className="w-full rounded-sm border-zinc-300 font-bold shadow-none disabled:opacity-100"
      >
        {actions.secondary.label}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled
        className="rounded-sm border-zinc-300 shadow-none disabled:opacity-100"
        aria-label={`${productName} 추가 액션: ${actions.more
          .map(action => action.label)
          .join(', ')}`}
      >
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
