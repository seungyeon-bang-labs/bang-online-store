import { notFound } from 'next/navigation';
import { requireActiveMember } from '@/app/(auth)/require-active-member';
import { createOrderRepository } from '@/domains/order/supabase-repository.server';
import { OrderComplete } from '@/features/checkout/order-complete';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';

interface OrderCompletePageProps {
  params: Promise<{ orderId: string }>;
}

async function OrderCompletePage({ params }: OrderCompletePageProps) {
  const [{ orderId }, member] = await Promise.all([
    params,
    requireActiveMember(),
  ]);
  // Another member's order and a missing one look the same: 404.
  const order = await createOrderRepository(await createAuthClient()).findByIdAndUserId(
    orderId,
    member.id,
  );
  if (!order) notFound();

  return <OrderComplete orderId={order.id} orderNumber={order.order_number} />;
}

export default OrderCompletePage;
