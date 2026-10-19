import 'server-only';

import { supabase } from '@/shared/lib/supabase/server';
import type { DiscountCandidateDTO } from './discount.dto';

const PAGE_SIZE = 500;
const ID_BATCH_SIZE = 100;

export const discountRepository = {
  async findByProductIds(ids: readonly number[]): Promise<readonly DiscountCandidateDTO[]> {
    const productIds = [...new Set(ids)];
    const candidates: DiscountCandidateDTO[] = [];

    for (let start = 0; start < productIds.length; start += ID_BATCH_SIZE) {
      const request = supabase.from('discount_items').select(
        'discount_id, product_id, discount_rate, discount:discounts!inner(id, title, starts_at, ends_at, priority, is_active)',
        { count: 'exact' },
      ).in('product_id', productIds.slice(start, start + ID_BATCH_SIZE))
        .order('discount_id').order('product_id');

      for (let offset = 0; ;) {
        const { data, error, count } = await request.range(offset, offset + PAGE_SIZE - 1);
        if (error || !data || count === null || (data.length === 0 && offset < count)) {
          throw new Error('할인 정보를 불러오지 못했습니다.');
        }
        for (const candidate of data) {
          if (!candidate.discount) throw new Error('할인의 필수 관계 정보가 없습니다.');
          candidates.push(candidate);
        }
        offset += data.length;
        if (offset >= count) break;
      }
    }

    return candidates.sort((a, b) => a.discount_id - b.discount_id || a.product_id - b.product_id);
  },
};
