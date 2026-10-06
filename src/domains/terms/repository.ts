import type { TermCodeDTO } from './dto';

export interface TermCodeRepository {
  findActive(): Promise<TermCodeDTO[]>;
}
