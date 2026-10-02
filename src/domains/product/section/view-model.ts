import type { ProductCardViewModel } from '../view-model';

export type ProductSectionViewModel = {
  id: number;
  title: string;
  desktopRows: number;
  productCardViewModels: readonly ProductCardViewModel[];
};
