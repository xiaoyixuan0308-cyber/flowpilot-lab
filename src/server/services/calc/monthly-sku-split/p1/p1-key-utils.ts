export function toDealerSkuKey(dealerCode: string | null | undefined, sku: string) {
  return `${dealerCode ?? ""}|${sku}`;
}

export function toDealerCategorySkuKey(
  businessUnit: string,
  dealerCode: string | null | undefined,
  categoryCode: string | null | undefined,
  sku: string
) {
  return `${businessUnit}|${dealerCode ?? ""}|${categoryCode ?? ""}|${sku}`;
}

export function toDealerCategoryKey(businessUnit: string, dealerCode: string | null | undefined, categoryCode: string) {
  return `${businessUnit}|${dealerCode ?? ""}|${categoryCode}`;
}

export function indexFirstByKey<T, K extends string>(rows: T[], keyFn: (row: T) => K): Map<K, T> {
  const map = new Map<K, T>();

  for (const row of rows) {
    const key = keyFn(row);
    if (!map.has(key)) {
      map.set(key, row);
    }
  }

  return map;
}
