import 'server-only';

import type { ProductModel } from '../product/model';
import type { CartRepository } from './cart.repository';
import type { CartCommand } from './cart.contract';
import type { CartSnapshotDTO } from './cart.dto';
import type { CartViewModel } from './cart.view-model';
import { cartCommandSchema } from './cart.schema';
import { CartDisplayMismatchError, toCartViewModel } from './cart.mapper';

export type CartProductPort = {
  findByIds(ids: readonly number[], options: { now: Date }): Promise<readonly ProductModel[]>;
  findByStyleId(styleId: number, options: { now: Date }): Promise<readonly ProductModel[]>;
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
      const options = (await Promise.all(styleIds.map(styleId => products.findByStyleId(styleId, { now: instant })))).flat();
      try {
        return toCartViewModel(snapshot, models, options);
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
