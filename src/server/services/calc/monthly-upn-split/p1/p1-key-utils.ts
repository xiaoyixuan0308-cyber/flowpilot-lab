export function toDealerUpnKey(dealerCode: string | null | undefined, upn: string) {
  return `${dealerCode ?? ""}|${upn}`;
}

export function toDealerPl5UpnKey(
  scBu: string,
  dealerCode: string | null | undefined,
  pl5Code: string | null | undefined,
  upn: string
) {
  return `${scBu}|${dealerCode ?? ""}|${pl5Code ?? ""}|${upn}`;
}

export function toDealerPl5Key(scBu: string, dealerCode: string | null | undefined, pl5Code: string) {
  return `${scBu}|${dealerCode ?? ""}|${pl5Code}`;
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
