import { snapshotData } from './snapshot.fixture';

export const snapshotRepository = {
  async findMany() {
    return snapshotData;
  },

  async findById(id: string) {
    return snapshotData.find(snapshot => snapshot.id === id) ?? null;
  },
};

