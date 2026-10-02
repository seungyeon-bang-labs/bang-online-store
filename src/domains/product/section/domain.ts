import type { ProductSectionDTO, ProductSectionItemDTO } from './dto';

export type ProductSection = ProductSectionDTO & {
  items: readonly ProductSectionItemDTO[];
};

export function createProductSections(
  sections: readonly ProductSectionDTO[],
  items: readonly ProductSectionItemDTO[],
): ProductSection[] {
  return [...sections]
    .sort((a, b) => a.display_order - b.display_order)
    .map(section => ({
      ...section,
      items: items
        .filter(item => item.section_id === section.id)
        .sort((a, b) => a.display_order - b.display_order),
    }));
}
