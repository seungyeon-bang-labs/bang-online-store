import { products } from './product.fixture';

export const productRepository = {
  async findMany() {
    return products;
  },

  async findById(id: number) {
    return products.find(product => product.id === id) ?? null;
  },

  async findByIds(ids: number[]) {
    return products.filter(product => ids.includes(product.id));
  },

  async findByGroupId(groupId: number) {
    return products.filter(product => product.group_id === groupId);
  },

  async findByCategory(categorySlug: string, subcategorySlug?: string) {
    return products.filter(product => {
      if (subcategorySlug && subcategorySlug !== 'all') {
        return (
          product.category.parent === categorySlug &&
          product.category.current === subcategorySlug
        );
      }

      return product.category.parent === categorySlug;
    });
  },
};
