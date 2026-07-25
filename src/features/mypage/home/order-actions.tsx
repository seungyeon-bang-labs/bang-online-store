'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  MypageHomeOrderAction,
  MypageHomeOrderActions,
  MypageHomeOrderCommandAction,
} from '@/domains/mypage';
import { useOrderActionCommand } from './hooks/use-order-action-command';

interface MypageHomeOrderActionsProps {
  actions: MypageHomeOrderActions;
  orderTitle: string;
}

const ORDER_ACTION_BUTTON_CLASS_NAME =
  'h-9 rounded-sm px-3 text-xs font-black shadow-none';
const ORDER_ACTION_OUTLINE_CLASS_NAME =
  'border-zinc-300 bg-white text-black hover:border-black hover:bg-black hover:text-white';

export function MypageHomeOrderActions({
  actions,
  orderTitle,
}: MypageHomeOrderActionsProps) {
  const runCommand = useOrderActionCommand();

  return (
    <div className="flex items-center gap-2">
      <MypageHomeOrderActionButton
        action={actions.primary}
        onCommand={runCommand}
      />
      <MypageHomeOrderActionButton
        action={actions.secondary}
        onCommand={runCommand}
      />
      <MypageHomeOrderActionMenu
        actions={actions.more}
        orderTitle={orderTitle}
        onCommand={runCommand}
      />
    </div>
  );
}

interface MypageHomeOrderActionButtonProps {
  action: MypageHomeOrderAction | null;
  onCommand: (action: MypageHomeOrderCommandAction) => void;
}

function MypageHomeOrderActionButton({
  action,
  onCommand,
}: MypageHomeOrderActionButtonProps) {
  if (!action) return null;

  const className = `${ORDER_ACTION_BUTTON_CLASS_NAME} ${ORDER_ACTION_OUTLINE_CLASS_NAME}`;

  if (action.behavior === 'link') {
    return (
      <ButtonLink
        href={action.href}
        variant="outline"
        size="default"
        className={className}
      >
        {action.label}
      </ButtonLink>
    );
  }

  if (action.behavior === 'placeholder') {
    return (
      <Button
        type="button"
        variant="outline"
        size="default"
        className={className}
      >
        {action.label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      className={className}
      onClick={() => onCommand(action)}
    >
      {action.label}
    </Button>
  );
}

interface MypageHomeOrderActionMenuProps {
  actions: MypageHomeOrderAction[];
  orderTitle: string;
  onCommand: (action: MypageHomeOrderCommandAction) => void;
}

function MypageHomeOrderActionMenu({
  actions,
  orderTitle,
  onCommand,
}: MypageHomeOrderActionMenuProps) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={`size-9 rounded-sm ${ORDER_ACTION_OUTLINE_CLASS_NAME}`}
          aria-label={`${orderTitle} 추가 행동`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {actions.map(action => (
          <MypageHomeOrderActionMenuItem
            key={action.type}
            action={action}
            onCommand={onCommand}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface MypageHomeOrderActionMenuItemProps {
  action: MypageHomeOrderAction;
  onCommand: (action: MypageHomeOrderCommandAction) => void;
}

function MypageHomeOrderActionMenuItem({
  action,
  onCommand,
}: MypageHomeOrderActionMenuItemProps) {
  const className = 'cursor-pointer focus:bg-black focus:text-white';

  if (action.behavior === 'link') {
    return (
      <DropdownMenuItem asChild className={className}>
        <Link href={action.href}>{action.label}</Link>
      </DropdownMenuItem>
    );
  }

  if (action.behavior === 'command') {
    return (
      <DropdownMenuItem className={className} onSelect={() => onCommand(action)}>
        {action.label}
      </DropdownMenuItem>
    );
  }

  return <DropdownMenuItem className={className}>{action.label}</DropdownMenuItem>;
}
