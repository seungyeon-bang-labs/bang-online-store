import type { OrderDetailShippingViewModel } from '@/domains/order';
import {
  MypageCard,
  MypageDetailInfoList,
} from '@/features/mypage/common';

interface MypageOrderDetailShippingProps {
  shipping: OrderDetailShippingViewModel;
}

export function MypageOrderDetailShipping({
  shipping,
}: MypageOrderDetailShippingProps) {
  return (
    <MypageCard.Collapsible title="배송지 정보" mobileLayout="full-bleed">
      <MypageCard.Body>
        <MypageDetailInfoList
          items={[
            {
              id: 'recipient-name',
              label: '받는 분',
              value: shipping.recipientName,
            },
            {
              id: 'recipient-phone',
              label: '전화번호',
              value: shipping.recipientPhone,
            },
            {
              id: 'address',
              label: '주소',
              value: (
                <>
                  {shipping.addressText}{' '}
                  <span className="whitespace-nowrap text-zinc-500">
                    ({shipping.postalCode})
                  </span>
                </>
              ),
              valueClassName: 'leading-relaxed',
              valueLayout: 'block',
            },
          ]}
        />
      </MypageCard.Body>
    </MypageCard.Collapsible>
  );
}
