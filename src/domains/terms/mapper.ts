import type { TermDTO, TermSummaryDTO } from './dto';
import type { SignupTermViewModel, TermDetailViewModel } from './view-model';

export function toTermDetailViewModel(row: TermDTO): TermDetailViewModel {
  return {
    title: row.title,
    content: row.content ?? '',
    version: row.version,
    effectiveDateLabel: new Date(row.effective_at).toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
    }),
  };
}

export function toSignupTerms(
  effectiveTerms: readonly TermSummaryDTO[],
): SignupTermViewModel[] {
  return effectiveTerms.map(term => ({
    termId: term.id,
    code: term.term_codes.code,
    label: term.title,
    required: term.is_required,
    kind: term.term_codes.kind,
    ...(term.term_codes.kind === 'document' ? { href: `/terms/${term.id}` } : {}),
  }));
}
