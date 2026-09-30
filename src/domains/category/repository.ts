import type { CategoryDTO } from './dto';
import { CATEGORY_FIXTURE } from './fixture';

export const categoryRepository = {
  async findMany(): Promise<readonly CategoryDTO[]> {
    return CATEGORY_FIXTURE;
  },
};
