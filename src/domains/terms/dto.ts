import type { Tables } from '@/shared/types/supabase';

export type TermSummaryDTO = Pick<Tables<'terms'>, 'id' | 'title' | 'is_required'> & {
  term_codes: Pick<Tables<'term_codes'>, 'code' | 'kind'>;
};

export type TermDTO = Tables<'terms'> & {
  term_codes: Pick<Tables<'term_codes'>, 'code' | 'title' | 'kind' | 'is_active'>;
};
