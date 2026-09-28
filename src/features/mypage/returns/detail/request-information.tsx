import type { OrderClaimDetailRequestViewModel } from '@/domains/order/claim/view-model';
import {
  MypageCard,
  MypageDetailInfoList,
} from '@/features/mypage/common';

interface MypageClaimDetailRequestInformationProps {
  request: OrderClaimDetailRequestViewModel;
}

export function MypageClaimDetailRequestInformation({
  request,
}: MypageClaimDetailRequestInformationProps) {
  return (
    <MypageCard.Collapsible title="요청 내용">
      <MypageCard.Body>
        <MypageDetailInfoList
          items={[
            { id: 'type', label: '유형', value: request.type.label },
            { id: 'reason', label: '신청 사유', value: request.reason },
            ...(request.description
              ? [
                  {
                    id: 'description',
                    label: '신청 상세 사유',
                    value: request.description,
                    valueClassName: 'whitespace-pre-wrap leading-relaxed',
                    valueLayout: 'block' as const,
                  },
                ]
              : []),
          ]}
        />
      </MypageCard.Body>
    </MypageCard.Collapsible>
  );
}
