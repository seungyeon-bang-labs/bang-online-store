import type { CouponDTO } from './coupon.dto';
import type {
  CouponCardViewModel,
  CouponSectionViewModel,
} from './coupon.view-model';

const DEFAULT_COUPON_SECTION_TITLE = 'COUPON BENEFITS';
const DEFAULT_COUPON_SECTION_DESCRIPTION =
  '다양한 쿠폰 혜택을 확인하고, 나에게 딱 맞는 쿠폰을 다운로드하세요!';

function formatCouponExpiryDate(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return year + '년 ' + month + '월 ' + day + '일 까지';
}

function getDiscountValueText(coupon: CouponDTO): string {
  switch (coupon.discount_type) {
    case 'percentage':
      return String(coupon.discount_value);
    case 'fixed':
      return coupon.discount_value.toLocaleString('ko-KR');
    case 'free_shipping':
      return '무료배송';
  }
}

function getDiscountUnitText(coupon: CouponDTO): string | undefined {
  switch (coupon.discount_type) {
    case 'percentage':
      return '%';
    case 'fixed':
      return '원';
    case 'free_shipping':
      return undefined;
  }
}

export function toCouponCardViewModel(
  coupon: CouponDTO,
): CouponCardViewModel {
  return {
    id: coupon.id,
    title: coupon.name,
    categoryText: coupon.category_label ?? 'EVENT',
    discountValueText: getDiscountValueText(coupon),
    discountUnitText: getDiscountUnitText(coupon),
    isDiscountUnitSubtle: coupon.discount_type === 'fixed',
    minOrderAmountText:
      coupon.min_order_amount > 0
        ? coupon.min_order_amount.toLocaleString('ko-KR') +
          '원 이상 구매 시'
        : '금액 제한 없음',
    expiryText: formatCouponExpiryDate(coupon.ends_at),
    isStackable: coupon.is_stackable,
  };
}

export function toCouponCardViewModels(
  coupons: CouponDTO[],
): CouponCardViewModel[] {
  return coupons.map(toCouponCardViewModel);
}

export function toCouponSectionViewModel({
  title,
  coupons,
}: {
  title?: string;
  coupons: CouponDTO[];
}): CouponSectionViewModel {
  return {
    title: title ?? DEFAULT_COUPON_SECTION_TITLE,
    description: DEFAULT_COUPON_SECTION_DESCRIPTION,
    coupons: toCouponCardViewModels(coupons),
  };
}
