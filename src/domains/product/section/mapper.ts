import type { ProductCardViewModel } from '../view-model';
import type { ProductSection } from './domain';
import type { ProductSectionViewModel } from './view-model';

export function toProductSectionViewModels(
  productSections: readonly ProductSection[],
  productCardViewModels: readonly ProductCardViewModel[],
): ProductSectionViewModel[] {
  const productsById = new Map(
    productCardViewModels.map(product => [product.id, product]),
  );

  return productSections.flatMap(section => {
    const sectionProducts = section.items.flatMap(item => {
      const product = productsById.get(item.product_id);
      return product ? [product] : [];
    });

    if (sectionProducts.length === 0) {
      return [];
    }

    return [
      {
        id: section.id,
        title: section.title,
        desktopRows: section.desktop_rows,
        productCardViewModels: sectionProducts,
      },
    ];
  });
}
