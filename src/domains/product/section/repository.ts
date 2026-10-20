import 'server-only';

import { supabase } from '@/shared/lib/supabase/server';
import type { ProductSectionDTO, ProductSectionItemDTO } from './dto';

const PAGE_SIZE = 500;
const ID_BATCH_SIZE = 100;

export const productSectionRepository = {
  async findActiveWithItems(): Promise<{
    sections: readonly ProductSectionDTO[];
    items: readonly ProductSectionItemDTO[];
  }> {
    const sections: ProductSectionDTO[] = [];
    const items: ProductSectionItemDTO[] = [];
    const sectionRequest = supabase.from('product_sections')
      .select('id, title, display_order, desktop_rows, is_active', { count: 'exact' })
      .eq('is_active', true).order('display_order').order('id');

    for (let offset = 0; ;) {
      const { data, error, count } = await sectionRequest.range(offset, offset + PAGE_SIZE - 1);
      if (error || !data || count === null || (data.length === 0 && offset < count)) {
        throw new Error('상품 진열 정보를 불러오지 못했습니다.');
      }
      sections.push(...data);
      offset += data.length;
      if (offset >= count) break;
    }

    for (let start = 0; start < sections.length; start += ID_BATCH_SIZE) {
      const itemRequest = supabase.from('product_section_items')
        .select('section_id, product_id, display_order', { count: 'exact' })
        .in('section_id', sections.slice(start, start + ID_BATCH_SIZE).map(section => section.id))
        .order('section_id').order('display_order').order('product_id');

      for (let offset = 0; ;) {
        const { data, error, count } = await itemRequest.range(offset, offset + PAGE_SIZE - 1);
        if (error || !data || count === null || (data.length === 0 && offset < count)) {
          throw new Error('상품 진열 정보를 불러오지 못했습니다.');
        }
        items.push(...data);
        offset += data.length;
        if (offset >= count) break;
      }
    }

    items.sort((a, b) => a.section_id - b.section_id
      || a.display_order - b.display_order || a.product_id - b.product_id);
    return { sections, items };
  },
};
