import { toProductModel } from './mapper';
import type { ProductModel } from './model';
import { productRepository } from './repository';

const isActiveProduct = (product: ProductModel) => product.state === 'active';

async function getProductModels(): Promise<ProductModel[]> {
  const productAggregates = await productRepository.findManyWithRelations();

  return productAggregates.map(toProductModel);
}

export const productService = {
  async findMany() {
    return (await getProductModels()).filter(isActiveProduct);
  },
  async findById(id: number) {
    return (
      (await getProductModels()).find(
        product => product.id === id && isActiveProduct(product),
      ) ?? null
    );
  },
  async findByIds(ids: readonly number[]) {
    const idSet = new Set(ids);
    return (await getProductModels()).filter(
      product => isActiveProduct(product) && idSet.has(product.id),
    );
  },
  async findByIdsIncludingInactive(ids: readonly number[]) {
    const idSet = new Set(ids);
    return (await getProductModels()).filter(product => idSet.has(product.id));
  },
  async findByCategoryIds(categoryIds: readonly string[]) {
    const categoryIdSet = new Set(categoryIds);
    return (await getProductModels()).filter(
      product =>
        isActiveProduct(product) && categoryIdSet.has(product.categoryId),
    );
  },
  async findByStyleId(styleId: number) {
    return (await getProductModels()).filter(
      product => product.styleId === styleId && isActiveProduct(product),
    );
  },
};
