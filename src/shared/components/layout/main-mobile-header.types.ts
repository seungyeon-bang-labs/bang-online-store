export interface MainMobileHeaderSibling {
  label: string;
  href: string;
}

export type MainMobileHeaderConfig =
  | { kind: 'brand' }
  | {
      kind: 'title';
      title: string;
      backHref?: string;
      action?: 'cart';
    }
  | {
      kind: 'category';
      title: string;
      siblings: MainMobileHeaderSibling[];
      action: 'cart';
    };
