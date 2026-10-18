import 'server-only';

import { supabase } from '@/shared/lib/supabase/server';
import { PRODUCT_STATS_FIXTURE } from './fixture';
import type {
  ProductAggregateDTO,
  ProductImageTypeDTO,
  ProductQuery,
  ProductSizeOptionDTO,
  ProductStateDTO,
} from './dto';

export const productRepository = {
  async findManyWithRelations(
    query?: ProductQuery,
  ): Promise<readonly ProductAggregateDTO[]> {
    if (query?.ids?.length === 0 || query?.categoryIds?.length === 0) return [];

    let request = supabase
      .from('products')
      .select(
        `
      id, style_id, color_id, display_name, price, state, created_at, restocked_at,
      style:product_styles!inner(id, name, category_id, created_at, updated_at),
      color:colors(id, label, code, hex_code),
      variants:product_variants(id, sku, product_id, size, stock, price_offset),
      images:product_images(id, product_id, image_path, image_type, display_order)
    `,
      )
      .eq('state', 'active')
      .order('id');

    if (query?.ids) request = request.in('id', [...query.ids]);
    if (query?.categoryIds)
      request = request.in('style.category_id', [...query.categoryIds]);
    if (query?.styleId !== undefined)
      request = request.eq('style_id', query.styleId);

    const { data, error } = await request;
    if (error || !data) throw new Error('상품 정보를 불러오지 못했습니다.');

    return data.map(({ style, color, variants, images, ...product }) => {
      if (!style || !color)
        throw new Error('상품의 필수 관계 정보가 없습니다.');

      return {
        product: { ...product, state: product.state as ProductStateDTO },
        style,
        color: {
          id: color.id,
          name: color.label,
          code: color.code,
          hex_code: color.hex_code,
        },
        // Values are constrained by the catalog migration's CHECK constraints.
        variants: [...variants]
          .sort((a, b) => a.id - b.id)
          .map(variant => ({
            ...variant,
            size: variant.size as ProductSizeOptionDTO,
          })),
        images: images.map(image => ({
          id: image.id,
          product_id: image.product_id,
          image_type: image.image_type as ProductImageTypeDTO,
          display_order: image.display_order,
          image_url: supabase.storage
            .from('product-images')
            .getPublicUrl(image.image_path).data.publicUrl,
        })),
        stats:
          PRODUCT_STATS_FIXTURE.find(
            stats => stats.product_id === product.id,
          ) ?? null,
      };
    });
  },
};
