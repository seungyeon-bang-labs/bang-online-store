import 'server-only';

import type { ProductModel } from '../product/model';
import type { ProductCartItemViewModel } from '../product/view-model';
import type { CartRepository } from './repository';
import type { CartCommand } from './contract';
import type { CartSnapshotDTO } from './dto';
import type { CartViewModel } from './view-model';
import { cartCommandSchema } from './schema';
import { CartDisplayMismatchError, toCartViewModel } from './mapper';

export type CartProductPort = {
  findByIds(ids: readonly number[], options: { now: Date }): Promise<readonly ProductModel[]>;
  findByStyleId(styleId: number, options: { now: Date }): Promise<readonly ProductModel[]>;
  findDiscontinuedCartItems(
    items: readonly { productId: number; variantId: number }[],
  ): Promise<readonly ProductCartItemViewModel[]>;
};

export function createCartService({ repository, products, now }: {
  repository: CartRepository;
  products: CartProductPort;
  now: () => Date;
}) {
  async function assemble(load: () => Promise<CartSnapshotDTO>): Promise<CartViewModel> {
    const instant = now();
    for (let attempt = 0; ; attempt++) {
      const snapshot = await load();
      if (snapshot.items.length === 0) return toCartViewModel(snapshot, [], []);
      const models = await products.findByIds([...new Set(snapshot.items.map(item => item.product_id))], { now: instant });
      const styleIds = [...new Set(models.map(product => product.styleId))];
      const onSale = new Set(models.map(product => product.id));
      const offSale = snapshot.items.filter(item => !onSale.has(item.product_id))
        .map(item => ({ productId: item.product_id, variantId: item.product_variant_id }));
      const [options, discontinued] = await Promise.all([
        Promise.all(styleIds.map(styleId => products.findByStyleId(styleId, { now: instant }))).then(groups => groups.flat()),
        offSale.length > 0 ? products.findDiscontinuedCartItems(offSale) : [],
      ]);
      try {
        return toCartViewModel(snapshot, models, options, discontinued);
      } catch (error) {
        // Only a successful-but-inconsistent display read merits one automatic replay.
        if (!(error instanceof CartDisplayMismatchError) || attempt >= 1) throw error;
      }
    }
  }

  return {
    read(expectedUserId: string) {
      return assemble(() => repository.read(expectedUserId));
    },
    apply(input: CartCommand) {
      const command = cartCommandSchema.parse(input);
      return assemble(() => repository.apply(command));
    },
  };
}
