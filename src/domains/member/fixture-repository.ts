import { CURRENT_USER } from './fixture';
import type { CurrentUserRepository } from './repository';

export const fixtureCurrentUserRepository: CurrentUserRepository = {
  async findCurrent() {
    return { ...CURRENT_USER };
  },
};
