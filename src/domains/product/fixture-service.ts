import { fixtureProductRepository } from './fixture-repository';
import { toProductModel } from './mapper';
import { createProductService } from './service';
import {
  fixtureDiscountRepository,
  selectFixtureProductDiscount,
} from '@/domains/discount/discount.fixture-repository';

export const fixtureProductService = {
  ...createProductService(fixtureProductRepository, fixtureDiscountRepository, selectFixtureProductDiscount),
  async findByIdsIncludingInactive(ids: readonly number[]) {
    const rows = await fixtureProductRepository.findManyWithRelations({ ids });
    const candidates = await fixtureDiscountRepository.findByProductIds(ids);
    return rows.map(row => toProductModel(row,
      selectFixtureProductDiscount(row.product.id, candidates)));
  },
};
