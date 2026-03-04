export type DbDateValue = string | Date;

export function parseDbDate(value: DbDateValue | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function toIsoString(value: DbDateValue | null | undefined): string | null {
  const parsed = parseDbDate(value);
  return parsed ? parsed.toISOString() : null;
}

export function isSaleActive(params: {
  onSale: boolean;
  salePrice: string | number | null;
  saleEndsAt: DbDateValue | null;
  now?: Date;
}) {
  const { onSale, salePrice, saleEndsAt, now = new Date() } = params;

  if (!onSale || salePrice === null) {
    return false;
  }

  const endsAt = parseDbDate(saleEndsAt);
  if (!endsAt) {
    return true;
  }

  return endsAt.getTime() > now.getTime();
}
