import { supabase } from '@/shared/lib/supabase/server';
import type { TermCodeRepository } from './repository';

export const supabaseTermCodeRepository: TermCodeRepository = {
  async findActive() {
    const { data, error } = await supabase
      .from('term_codes')
      .select('*')
      .eq('is_active', true)
      .order('created_at')
      .order('code');

    if (error) {
      throw new Error('약관 정보를 불러오지 못했습니다.', { cause: error });
    }

    return data;
  },
};
