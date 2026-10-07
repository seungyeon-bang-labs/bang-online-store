import { supabase } from '@/shared/lib/supabase/server';
import type { TermDTO, TermSummaryDTO } from './dto';

export interface TermRepository {
  findEffective(): Promise<TermSummaryDTO[]>;
  findEffectiveById(termId: string): Promise<TermDTO | null>;
}

const termSelect = '*, term_codes!inner(code, title, kind, is_active)' as const;
const termSummarySelect = 'id, title, is_required, term_codes!inner(code, kind)' as const;

export const termRepository: TermRepository = {
  async findEffective() {
    const { data, error } = await supabase
      .from('terms')
      .select(termSummarySelect)
      .eq('is_active', true)
      .eq('term_codes.is_active', true)
      .lte('effective_at', new Date().toISOString())
      .order('created_at')
      .order('id');

    if (error) {
      throw new Error('약관 정보를 불러오지 못했습니다.', { cause: error });
    }
    return data;
  },
  async findEffectiveById(termId) {
    const { data, error } = await supabase
      .from('terms')
      .select(termSelect)
      .eq('id', termId)
      .eq('is_active', true)
      .eq('term_codes.is_active', true)
      .lte('effective_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      throw new Error('약관 정보를 불러오지 못했습니다.', { cause: error });
    }
    return data;
  },
};
