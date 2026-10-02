import {
  PRODUCT_COLOR_FIXTURE,
  PRODUCT_FIXTURE,
  PRODUCT_IMAGE_FIXTURE,
  PRODUCT_STATS_FIXTURE,
  PRODUCT_STYLE_FIXTURE,
  PRODUCT_VARIANT_FIXTURE,
} from './fixture';
import type {
  ProductColorDTO,
  ProductDTO,
  ProductImageDTO,
  ProductStatsDTO,
  ProductStyleDTO,
  ProductVariantDTO,
} from './dto';

type ProductAggregateDTO = {
  product: ProductDTO;
  style: ProductStyleDTO;
  color: ProductColorDTO;
  variants: readonly ProductVariantDTO[];
  stats: ProductStatsDTO | null;
  images: readonly ProductImageDTO[];
};

export const productRepository = {
  async findManyWithRelations(): Promise<readonly ProductAggregateDTO[]> {
    const stylesById = new Map(
      PRODUCT_STYLE_FIXTURE.map(style => [style.id, style]),
    );
    const colorsById = new Map(
      PRODUCT_COLOR_FIXTURE.map(color => [color.id, color]),
    );
    const statsByProductId = new Map(
      PRODUCT_STATS_FIXTURE.map(stats => [stats.product_id, stats]),
    );
    const variantsByProductId = new Map<number, ProductVariantDTO[]>();
    const imagesByProductId = new Map<number, ProductImageDTO[]>();

    for (const variant of PRODUCT_VARIANT_FIXTURE) {
      variantsByProductId.set(variant.product_id, [
        ...(variantsByProductId.get(variant.product_id) ?? []),
        variant,
      ]);
    }

    for (const image of PRODUCT_IMAGE_FIXTURE) {
      imagesByProductId.set(image.product_id, [
        ...(imagesByProductId.get(image.product_id) ?? []),
        image,
      ]);
    }

    return PRODUCT_FIXTURE.map(product => {
      const style = stylesById.get(product.style_id);
      const color = colorsById.get(product.color_id);

      if (!style || !color) {
        throw new Error(
          `Product relation is missing for products.id=${product.id}`,
        );
      }

      return {
        product,
        style,
        color,
        variants: variantsByProductId.get(product.id) ?? [],
        stats: statsByProductId.get(product.id) ?? null,
        images: imagesByProductId.get(product.id) ?? [],
      };
    });
  },
};
