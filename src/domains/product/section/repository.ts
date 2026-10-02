import type { ProductSectionDTO, ProductSectionItemDTO } from './dto';
import {
  PRODUCT_SECTION_FIXTURE,
  PRODUCT_SECTION_ITEM_FIXTURE,
} from './fixture';

export const productSectionRepository = {
  async findActiveWithItems(): Promise<{
    sections: readonly ProductSectionDTO[];
    items: readonly ProductSectionItemDTO[];
  }> {
    const sections = PRODUCT_SECTION_FIXTURE.filter(section => section.is_active);
    const sectionIds = new Set(sections.map(section => section.id));

    return {
      sections,
      items: PRODUCT_SECTION_ITEM_FIXTURE.filter(item =>
        sectionIds.has(item.section_id),
      ),
    };
  },
};
