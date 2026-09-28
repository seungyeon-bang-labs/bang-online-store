'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { getMypageAddressEditHref } from '@/shared/lib/mypage-routes';
import { MoreVertical } from 'lucide-react';
import { MYPAGE_ACTION_MENU_CLASS_NAME } from '../common/styles';
import { MypageAddressDeleteDialog } from './delete-button';

const ADDRESS_ACTION_MENU_TRIGGER_CLASS_NAME =
  `-mr-3 flex size-10 shrink-0 items-center justify-center rounded-sm text-zinc-700 outline-none transition-colors hover:bg-zinc-100 hover:text-black focus-visible:bg-zinc-100 focus-visible:text-black md:hidden ${MYPAGE_ACTION_MENU_CLASS_NAME.quietTrigger}`;

interface MypageAddressMobileActionsProps {
  addressId: string;
  canDelete: boolean;
}

export function MypageAddressMobileActions({
  addressId,
  canDelete,
}: MypageAddressMobileActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label="배송지 추가 메뉴"
          className={ADDRESS_ACTION_MENU_TRIGGER_CLASS_NAME}
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={MYPAGE_ACTION_MENU_CLASS_NAME.content}
        >
          {canDelete && (
            <>
              <DropdownMenuItem className={MYPAGE_ACTION_MENU_CLASS_NAME.item}>
                기본으로 설정
              </DropdownMenuItem>
              <DropdownMenuSeparator
                className={MYPAGE_ACTION_MENU_CLASS_NAME.separator}
              />
            </>
          )}
          <DropdownMenuItem
            asChild
            className={MYPAGE_ACTION_MENU_CLASS_NAME.item}
          >
            <Link href={getMypageAddressEditHref(addressId)}>수정</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator
            className={MYPAGE_ACTION_MENU_CLASS_NAME.separator}
          />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setIsDeleteDialogOpen(true)}
            className={MYPAGE_ACTION_MENU_CLASS_NAME.destructiveItem}
          >
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <MypageAddressDeleteDialog
        canDelete={canDelete}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
}
