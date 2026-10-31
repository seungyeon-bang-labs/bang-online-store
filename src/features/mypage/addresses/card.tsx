import { MYPAGE_ACTION_CLASS_NAME } from '@/features/mypage/common/styles';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import type { UserAddressViewModel } from '@/domains/member';
import { MypageCard } from '@/features/mypage/common';
import { getMypageAddressEditHref } from '@/shared/lib/mypage-routes';
import { MypageAddressDeleteButton } from './delete-button';
import { MypageAddressMobileActions } from './mobile-actions';
import { MypageAddressSetDefaultButton } from './set-default-button';
import type { MypageAddressActions } from './types';

interface MypageAddressCardProps extends MypageAddressActions {
  address: UserAddressViewModel;
}

export function MypageAddressCard({
  address,
  onSetDefaultAddress,
  onDeleteAddress,
}: MypageAddressCardProps) {
  return (
    <MypageCard as="article">
      <MypageCard.Header
        className="gap-3"
        right={
          <div className="flex shrink-0 items-center">
            <MypageAddressMobileActions
              addressId={address.id}
              canDelete={!address.isDefault}
              onSetDefaultAddress={onSetDefaultAddress}
              onDeleteAddress={onDeleteAddress}
            />
            {!address.isDefault && (
              <MypageAddressSetDefaultButton
                addressId={address.id}
                onSetDefaultAddress={onSetDefaultAddress}
              />
            )}
          </div>
        }
      >
        <div className="flex min-w-0 items-center gap-2">
          <MypageCard.Title className="truncate">
            {address.displayName}
          </MypageCard.Title>
          {address.isDefault && (
            <span className="shrink-0 rounded-sm bg-black px-1.5 py-0.5 text-[11px] leading-4 font-black text-white md:px-2 md:py-1 md:text-xs md:leading-normal">
              기본 배송지
            </span>
          )}
        </div>
      </MypageCard.Header>

      <MypageCard.Body className="md:pb-0">
        <p className="text-sm font-bold leading-relaxed text-black">
          {address.formattedAddress}
        </p>
        <p className="mt-2 text-sm font-medium text-zinc-700">
          {address.recipientName} · {address.phoneNumber}
        </p>
        {address.deliveryNote && (
          <p className="mt-2 text-sm font-medium text-zinc-700">
            배송 메모: {address.deliveryNote}
          </p>
        )}
      </MypageCard.Body>
      <MypageCard.Footer className="hidden pt-4 md:block md:pt-4">
        <div className="grid grid-cols-2 gap-2">
          <MypageAddressDeleteButton
            addressId={address.id}
            canDelete={!address.isDefault}
            onDeleteAddress={onDeleteAddress}
          />
          <Button
            variant="outline"
            size="sm"
            asChild
            className={`w-full ${MYPAGE_ACTION_CLASS_NAME.outline}`}
          >
            <Link href={getMypageAddressEditHref(address.id)}>수정</Link>
          </Button>
        </div>
      </MypageCard.Footer>
    </MypageCard>
  );
}
