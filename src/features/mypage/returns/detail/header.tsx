import type { OrderClaimDetailInformationViewModel } from '@/domains/order/claim/view-model';
import {
  MypageCard,
  MypageDetailInfoList,
} from '@/features/mypage/common';

interface MypageClaimDetailHeaderProps {
  information: OrderClaimDetailInformationViewModel;
}

export function MypageClaimDetailHeader({
  information,
}: MypageClaimDetailHeaderProps) {
  return (
    <MypageCard>
      <MypageCard.Body>
        <MypageDetailInfoList
          items={[
            {
              id: 'order-number',
              label: '주문 번호',
              value: information.orderNumber,
              valueClassName: 'break-all font-black',
            },
            {
              id: 'requested-at',
              label: '신청일',
              value: information.requestedAt,
            },
            ...(information.completedAt
              ? [
                  {
                    id: 'completed-at',
                    label: '완료일',
                    value: information.completedAt,
                  },
                ]
              : []),
            ...(information.cancelledAt
              ? [
                  {
                    id: 'cancelled-at',
                    label: '취소일',
                    value: information.cancelledAt,
                  },
                ]
              : []),
          ]}
          labelWidth="narrow"
        />
      </MypageCard.Body>
    </MypageCard>
  );
}
