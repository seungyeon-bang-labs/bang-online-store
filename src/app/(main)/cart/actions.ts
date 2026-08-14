'use server';

import { currentUserRepository, userAddressRepository } from '@/domains/member';
import { createDemoOrder, type DemoOrderCartItem } from '@/domains/order';

export async function createDemoOrderFromCart(
  items: DemoOrderCartItem[],
): Promise<string> {
  const user = await currentUserRepository.findCurrent();
  if (!user) throw new Error('주문자 정보를 확인할 수 없습니다.');

  const address = await userAddressRepository.findDefaultByUserId(user.id);
  if (!address) throw new Error('기본 배송지를 확인할 수 없습니다.');

  return createDemoOrder({
    userId: user.id,
    recipientName: address.recipient_name,
    recipientPhone: address.phone_number,
    postalCode: address.postal_code,
    shippingAddressText: [address.address_line_1, address.address_line_2]
      .filter(Boolean)
      .join(' '),
    items,
  });
}
