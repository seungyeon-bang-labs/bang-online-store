'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button, ButtonLink } from '@/shared/components/ui/button';
import {
  MYPAGE_ACTION_CLASS_NAME,
  MYPAGE_ACTION_MENU_CLASS_NAME,
} from '../common/styles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import type {
  MypageHomeOrderAction,
  MypageHomeOrderActions,
  MypageHomeOrderCommandAction,
} from '@/domains/mypage';
import { useOrderActionCommand } from './hooks/use-order-action-command';
import { useCartState } from '@/features/cart/use-cart';
import { selectCartLocked } from '@/features/cart/cart-selectors';

interface MypageHomeOrderActionsProps {
  actions: MypageHomeOrderActions;
  orderTitle: string;
}

const ORDER_ACTION_BUTTON_CLASS_NAME =
  'h-8 min-w-0 flex-1 lg:flex-none';
const ORDER_ACTION_OUTLINE_CLASS_NAME =
  MYPAGE_ACTION_CLASS_NAME.outline;

export function MypageHomeOrderActions({
  actions,
  orderTitle,
}: MypageHomeOrderActionsProps) {
  const runCommand = useOrderActionCommand();
  // Repurchase waits while the cart saves or before any cart was shown.
  const commandDisabled = useCartState(selectCartLocked);

  return (
    <div className="flex w-full items-center gap-2 lg:w-auto">
      <MypageHomeOrderActionButton
        action={actions.primary}
        onCommand={runCommand}
        commandDisabled={commandDisabled}
      />
      <MypageHomeOrderActionButton
        action={actions.secondary}
        onCommand={runCommand}
        commandDisabled={commandDisabled}
      />
      <MypageHomeOrderActionMenu
        actions={actions.more}
        orderTitle={orderTitle}
        onCommand={runCommand}
        commandDisabled={commandDisabled}
      />
    </div>
  );
}

interface MypageHomeOrderActionButtonProps {
  action: MypageHomeOrderAction | null;
  onCommand: (action: MypageHomeOrderCommandAction) => void;
  commandDisabled: boolean;
}

function MypageHomeOrderActionButton({
  action,
  onCommand,
  commandDisabled,
}: MypageHomeOrderActionButtonProps) {
  if (!action) return null;

  const className = `${ORDER_ACTION_BUTTON_CLASS_NAME} ${ORDER_ACTION_OUTLINE_CLASS_NAME} font-medium md:font-bold`;

  if (action.behavior === 'link') {
    return (
      <ButtonLink
        href={action.href}
        variant="outline"
        size="sm"
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
        size="sm"
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
      size="sm"
      className={className}
      disabled={commandDisabled}
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
  commandDisabled: boolean;
}

function MypageHomeOrderActionMenu({
  actions,
  orderTitle,
  onCommand,
  commandDisabled,
}: MypageHomeOrderActionMenuProps) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={`size-8 rounded-sm ${MYPAGE_ACTION_CLASS_NAME.outline} ${MYPAGE_ACTION_MENU_CLASS_NAME.outlineTrigger}`}
          aria-label={`${orderTitle} 추가 메뉴`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={MYPAGE_ACTION_MENU_CLASS_NAME.content}
      >
        {actions.map((action, index) => (
          <Fragment key={action.type}>
            <MypageHomeOrderActionMenuItem
              action={action}
              onCommand={onCommand}
              commandDisabled={commandDisabled}
            />
            {index < actions.length - 1 && (
              <DropdownMenuSeparator
                className={MYPAGE_ACTION_MENU_CLASS_NAME.separator}
              />
            )}
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface MypageHomeOrderActionMenuItemProps {
  action: MypageHomeOrderAction;
  onCommand: (action: MypageHomeOrderCommandAction) => void;
  commandDisabled: boolean;
}

function MypageHomeOrderActionMenuItem({
  action,
  onCommand,
  commandDisabled,
}: MypageHomeOrderActionMenuItemProps) {
  const className = `${MYPAGE_ACTION_MENU_CLASS_NAME.item} h-11 font-medium md:h-10 md:font-bold`;

  if (action.behavior === 'link') {
    return (
      <DropdownMenuItem asChild className={className}>
        <Link href={action.href}>{action.label}</Link>
      </DropdownMenuItem>
    );
  }

  if (action.behavior === 'command') {
    return (
      <DropdownMenuItem className={className} disabled={commandDisabled} onSelect={() => onCommand(action)}>
        {action.label}
      </DropdownMenuItem>
    );
  }

  return <DropdownMenuItem className={className}>{action.label}</DropdownMenuItem>;
}
