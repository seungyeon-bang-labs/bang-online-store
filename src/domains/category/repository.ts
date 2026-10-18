import 'server-only';

import { supabase } from '@/shared/lib/supabase/server';
import type { CategoryDTO } from './dto';

export const categoryRepository = {
  async findMany(): Promise<readonly CategoryDTO[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_path, alt_text, display_order')
      .order('display_order')
      .order('id');

    if (error || !data) throw new Error('카테고리를 불러오지 못했습니다.');

    return data.map(({ image_path, ...category }) => ({
      ...category,
      image_url:
        image_path === null
          ? null
          : supabase.storage.from('category-images').getPublicUrl(image_path)
              .data.publicUrl,
    }));
  },
};
