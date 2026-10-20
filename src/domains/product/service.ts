import { toProductModel } from './mapper';
import type { ProductAggregateDTO, ProductQuery } from './dto';
import { selectProductDiscount } from '@/domains/discount/discount.domain';
import type { DiscountCandidateDTO } from '@/domains/discount/discount.dto';
import type { ProductSaleSectionModel } from './model';

export type ProductReadOptions = { now?: Date };
export type ProductDiscountRepository = {
  findByProductIds(ids: readonly number[]): Promise<readonly DiscountCandidateDTO[]>;
};

export function createProductService(repository: {
  findManyWithRelations(query?: ProductQuery): Promise<readonly ProductAggregateDTO[]>;
}, discounts: ProductDiscountRepository, chooseDiscount = selectProductDiscount) {
  async function find(query?: ProductQuery, options?: ProductReadOptions) {
    const now = options?.now ?? new Date();
    const rows = (await repository.findManyWithRelations(query))
      .filter(row => row.product.state === 'active');
    const candidates = rows.length > 0
      ? await discounts.findByProductIds(rows.map(row => row.product.id))
      : [];
    const products = rows.map(row => toProductModel(
      row, chooseDiscount(row.product.id, candidates, now),
    ));
    return { products, candidates };
  }

  return {
    async findMany(options?: ProductReadOptions) {
      return (await find(undefined, options)).products;
    },
    async findById(id: number, options?: ProductReadOptions) {
      return (await find({ ids: [id] }, options)).products[0] ?? null;
    },
    async findByIds(ids: readonly number[], options?: ProductReadOptions) {
      return (await find({ ids }, options)).products;
    },
    async findByCategoryIds(categoryIds: readonly string[], options?: ProductReadOptions) {
      return (await find({ categoryIds }, options)).products;
    },
    async findByStyleId(styleId: number, options?: ProductReadOptions) {
      return (await find({ styleId }, options)).products;
    },
    async findSaleSections(options?: ProductReadOptions): Promise<readonly ProductSaleSectionModel[]> {
      const { products, candidates } = await find(undefined, options);
      const campaignIds = new Set(products.flatMap(product =>
        product.appliedDiscountId === null ? [] : [product.appliedDiscountId]));
      return [...campaignIds].map(id => {
        const campaign = candidates.find(candidate => candidate.discount_id === id)?.discount;
        if (!campaign) throw new Error('적용된 할인 정보를 확인하지 못했습니다.');
        return {
          id, title: campaign.title, priority: campaign.priority, endsAt: campaign.ends_at,
          products: products.filter(product => product.appliedDiscountId === id),
        };
      });
    },
  };
}
