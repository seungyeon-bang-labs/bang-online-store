import Link from 'next/link';
import type { OrderDetailViewModel } from '@/domains/order';
import { Button } from '@/shared/components/ui/button';
import {
  MypageCard,
  MypageDetailInfoList,
} from '@/features/mypage/common';
import { getMypageOrderReceiptHref } from '@/shared/lib/mypage-routes';
import { MYPAGE_ACTION_CLASS_NAME } from '../../common/styles';

interface MypageOrderDetailHeaderProps {
  order: Pick<OrderDetailViewModel, 'id' | 'orderNumber' | 'orderedAt' | 'paidAt'>;
}

export function MypageOrderDetailHeader({
  order,
}: MypageOrderDetailHeaderProps) {
  return (
    <MypageCard mobileLayout="full-bleed">
      <MypageCard.Body>
        <div className="md:flex md:items-center md:justify-between md:gap-4">
          <MypageDetailInfoList
            items={[
              {
                id: 'ordered-at',
                label: '주문한 날짜',
                value: order.orderedAt,
              },
              {
                id: 'order-number',
                label: '주문 번호',
                value: order.orderNumber,
                valueClassName: 'break-all font-black md:truncate',
              },
            ]}
            labelWidth="narrow"
            className="min-w-0 flex-1"
          />
          <ReceiptLinkButton
            order={order}
            className="mt-4 w-full md:mt-0 md:w-auto md:shrink-0"
          />
        </div>
      </MypageCard.Body>
    </MypageCard>
  );
}

interface ReceiptLinkButtonProps {
  order: Pick<OrderDetailViewModel, 'id' | 'paidAt'>;
  className?: string;
}

function ReceiptLinkButton({ order, className }: ReceiptLinkButtonProps) {
  const buttonClassName = `${MYPAGE_ACTION_CLASS_NAME.outline} ${className ?? ''}`;

  if (!order.paidAt) return null;

  return (
    <Button variant="outline" size="default" asChild className={buttonClassName}>
      <Link href={getMypageOrderReceiptHref(order.id)}>영수증</Link>
    </Button>
  );
}
