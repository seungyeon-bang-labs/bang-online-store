export class DataIntegrityError extends Error {
  constructor(relationName: string, ownerId: string | number) {
    super(
      'Missing required relation "' +
        relationName +
        '" for record "' +
        String(ownerId) +
        '".',
    );
    this.name = 'DataIntegrityError';
  }
}

export function requireRelation<T>(
  value: T | null | undefined,
  relationName: string,
  ownerId: string | number,
): T {
  if (value === null || value === undefined) {
    throw new DataIntegrityError(relationName, ownerId);
  }

  return value;
}
