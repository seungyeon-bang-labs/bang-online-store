import { fixtureProductRepository } from './fixture-repository';
import { toProductModel } from './mapper';
import { createProductService } from './service';

export const fixtureProductService = {
  ...createProductService(fixtureProductRepository),
  async findByIdsIncludingInactive(ids: readonly number[]) {
    return (await fixtureProductRepository.findManyWithRelations({ ids }))
      .map(toProductModel);
  },
};
