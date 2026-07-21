import { EVENTS } from './fixture';

export const eventRepository = {
  async findMany() {
    return EVENTS;
  },

  async findById(id: number) {
    return EVENTS.find(event => event.id === id) ?? null;
  },
};
