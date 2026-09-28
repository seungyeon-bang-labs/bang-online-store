import type { OrderClaimDetailAddressViewModel } from '@/domains/order/claim/view-model';
import {
  MypageCard,
  MypageDetailInfoList,
} from '@/features/mypage/common';

interface MypageClaimDetailAddressProps {
  address: OrderClaimDetailAddressViewModel;
}

export function MypageClaimDetailAddress({
  address,
}: MypageClaimDetailAddressProps) {
  return (
    <MypageCard.Collapsible title={address.title}>
      <MypageCard.Body>
        <MypageDetailInfoList
          items={[
            { id: 'name', label: '이름', value: address.contactName },
            { id: 'phone', label: '연락처', value: address.contactPhone },
            {
              id: 'address',
              label: '주소',
              value: (
                <>
                  {address.addressText}{' '}
                  <span className="whitespace-nowrap text-zinc-500">
                    ({address.postalCode})
                  </span>
                </>
              ),
              valueClassName: 'leading-relaxed',
              valueLayout: 'block',
            },
          ]}
        />
        {address.description ? (
          <p className="mt-3 text-sm font-medium text-zinc-500">
            {address.description}
          </p>
        ) : null}
      </MypageCard.Body>
    </MypageCard.Collapsible>
  );
}
