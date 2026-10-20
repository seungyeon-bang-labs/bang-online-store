import 'server-only';

import type { QueryData } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase/server';
import type {
  ProductAggregateDTO,
  ProductImageTypeDTO,
  ProductQuery,
  ProductSizeOptionDTO,
  ProductStateDTO,
} from './dto';

// The project's verified Data API limit is 1,000 rows.
const PAGE_SIZE = 500;
const ID_BATCH_SIZE = 100;

function filterBatches<T>(values?: readonly T[]): (T[] | undefined)[] {
  if (!values) return [undefined];
  const unique = [...new Set(values)];
  return Array.from({ length: Math.ceil(unique.length / ID_BATCH_SIZE) },
    (_, index) => unique.slice(index * ID_BATCH_SIZE, (index + 1) * ID_BATCH_SIZE));
}

export const productRepository = {
  async findManyWithRelations(
    query?: ProductQuery,
  ): Promise<readonly ProductAggregateDTO[]> {
    if (query?.ids?.length === 0 || query?.categoryIds?.length === 0) return [];

    const result: ProductAggregateDTO[] = [];
    for (const ids of filterBatches(query?.ids)) {
      for (const categoryIds of filterBatches(query?.categoryIds)) {
        // The size CHECK and unique(product_id, size) limit embedded variants to nine.
        let request = supabase
          .from('products')
          .select(
            `
            id, style_id, color_id, display_name, price, state, created_at, restocked_at,
            style:product_styles!inner(id, name, category_id, created_at, updated_at),
            color:colors(id, label, code, hex_code),
            variants:product_variants(id, sku, product_id, size, stock, price_offset),
            stats:product_stats(product_id, total_sales, today_sales, weekly_sales, monthly_sales)
          `,
            { count: 'exact' },
          )
          .eq('state', 'active')
          .order('id');

        if (ids) request = request.in('id', ids);
        if (categoryIds)
          request = request.in('style.category_id', categoryIds);
        if (query?.styleId !== undefined)
          request = request.eq('style_id', query.styleId);

        const products: QueryData<typeof request> = [];
        for (let offset = 0; ;) {
          const { data, error, count } = await request.range(offset, offset + PAGE_SIZE - 1);
          if (error || !data || count === null || (data.length === 0 && offset < count)) {
            throw new Error('상품 정보를 불러오지 못했습니다.');
          }
          products.push(...data);
          offset += data.length;
          if (offset >= count) break;
        }

        // Images are unbounded, so read their top-level pages separately.
        const images: {
          id: number; product_id: number; image_path: string;
          image_type: string; display_order: number;
        }[] = [];
        for (let start = 0; start < products.length; start += ID_BATCH_SIZE) {
          const imageRequest = supabase.from('product_images')
            .select('id, product_id, image_path, image_type, display_order', { count: 'exact' })
            .in('product_id', products.slice(start, start + ID_BATCH_SIZE).map(product => product.id))
            .order('product_id').order('id');
          for (let offset = 0; ;) {
            const { data, error, count } = await imageRequest.range(offset, offset + PAGE_SIZE - 1);
            if (error || !data || count === null || (data.length === 0 && offset < count)) {
              throw new Error('상품 정보를 불러오지 못했습니다.');
            }
            images.push(...data);
            offset += data.length;
            if (offset >= count) break;
          }
        }

        result.push(...products.map(({ style, color, variants, stats, ...product }) => {
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
            images: images.filter(image => image.product_id === product.id).map(image => ({
              id: image.id,
              product_id: image.product_id,
              image_type: image.image_type as ProductImageTypeDTO,
              display_order: image.display_order,
              image_url: supabase.storage
                .from('product-images')
                .getPublicUrl(image.image_path).data.publicUrl,
            })),
            stats,
          };
        }));
      }
    }
    return result.sort((a, b) => a.product.id - b.product.id);
  },
};
