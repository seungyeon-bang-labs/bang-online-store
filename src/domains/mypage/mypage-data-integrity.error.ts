export class MypageDataIntegrityError extends Error {
  constructor(relationName: string, ownerId: string | number) {
    super(
      'Missing required relation "' +
        relationName +
        '" for record "' +
        String(ownerId) +
        '".',
    );
    this.name = 'MypageDataIntegrityError';
  }
}

export function requireMypageRelation<T>(
  value: T | null | undefined,
  relationName: string,
  ownerId: string | number,
): T {
  if (value === null || value === undefined) {
    throw new MypageDataIntegrityError(relationName, ownerId);
  }

  return value;
}
