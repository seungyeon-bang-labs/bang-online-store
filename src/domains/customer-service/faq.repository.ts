import { FAQ_DATA } from './faq.fixture';

export const faqRepository = {
  async findMany() {
    return FAQ_DATA;
  },
};
