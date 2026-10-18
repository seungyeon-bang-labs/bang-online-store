import { toProductModel } from './mapper';
import type { ProductAggregateDTO, ProductQuery } from './dto';

export function createProductService(repository: {
  findManyWithRelations(query?: ProductQuery): Promise<readonly ProductAggregateDTO[]>;
}) {
  async function find(query?: ProductQuery) {
    const rows = await repository.findManyWithRelations(query);
    return rows.map(toProductModel).filter(product => product.state === 'active');
  }

  return {
    findMany: () => find(),
    async findById(id: number) {
      return (await find({ ids: [id] }))[0] ?? null;
    },
    findByIds: (ids: readonly number[]) => find({ ids }),
    findByCategoryIds: (categoryIds: readonly string[]) => find({ categoryIds }),
    findByStyleId: (styleId: number) => find({ styleId }),
  };
}
