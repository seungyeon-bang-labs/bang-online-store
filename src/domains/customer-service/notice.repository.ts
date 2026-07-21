import { NOTICES } from './notice.fixture';

export const noticeRepository = {
  async findMany() {
    return NOTICES;
  },
};
