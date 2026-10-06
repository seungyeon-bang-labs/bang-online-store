import type { TermCodeDTO } from './dto';
import type { SignupTermViewModel } from './view-model';

export function toSignupTerms(rows: TermCodeDTO[]): SignupTermViewModel[] {
  return rows.filter(row => row.is_active).map(row => ({
    code: row.code,
    label: row.title,
    required: row.is_required,
    href: '/terms',
  }));
}
