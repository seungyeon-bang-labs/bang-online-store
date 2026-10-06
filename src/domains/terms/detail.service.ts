import { toTermDetailViewModel } from './mapper';
import { termRepository } from './repository';
import type { TermDetailViewModel } from './view-model';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getTermDetailViewModel(
  termId: string,
): Promise<TermDetailViewModel | null> {
  if (!UUID_PATTERN.test(termId)) {
    return null;
  }

  const term = await termRepository.findEffectiveById(termId);
  if (!term || term.term_codes.kind !== 'document') {
    return null;
  }

  return toTermDetailViewModel(term);
}
