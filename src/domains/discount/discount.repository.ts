import { DISCOUNTS } from './discount.fixture';

export const discountRepository = {
  async findMany() {
    return DISCOUNTS;
  },

  async findActive() {
    return DISCOUNTS.filter(discount => discount.isActive);
  },
};

