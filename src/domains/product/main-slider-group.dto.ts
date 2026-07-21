export interface MainSliderGroupDTO {
  id: number;
  title: string;
  productIds: number[];
  sliderOptions?: {
    rows?: number;
  };
}

export type MainSliderGroupData = MainSliderGroupDTO;

