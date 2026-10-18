'use server';

export async function createDemoOrderFromCart(): Promise<never> {
  // 주문 DB 전환 전에는 카탈로그와 데모 주문의 상품 소스가 다릅니다.
  throw new Error('주문 기능은 준비 중입니다.');
}
