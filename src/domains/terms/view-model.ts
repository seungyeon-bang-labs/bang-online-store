import type { Enums } from '@/shared/types/supabase';

export interface TermDetailViewModel {
  title: string;
  content: string;
  version: string;
  effectiveDateLabel: string;
}

export interface SignupTermViewModel {
  termId: string;
  code: string;
  label: string;
  required: boolean;
  kind: Enums<'term_kind'>;
  href?: string;
}
