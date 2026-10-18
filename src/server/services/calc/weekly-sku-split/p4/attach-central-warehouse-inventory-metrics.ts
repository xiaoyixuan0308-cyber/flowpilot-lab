import { add10, clampMinZero, indexBySum, subtract10 } from "../weekly-sku-split.helpers";
import type {
  WeeklyCentralWarehouseInventoryRow,
  WeeklyCentralWarehouseIntransitRow,
  WeeklyP3Row,
  WeeklyP4Row,
  WeeklySafetyStockRow,
} from "../weekly-sku-split.types";

const AVAILABLE_SLOCS = new Set(["Y001", "0001"]);

export function attachCentralWarehouseInventoryMetrics(
  rows: WeeklyP3Row[],
  inventoryRows: WeeklyCentralWarehouseInventoryRow[],
  intransitRows: WeeklyCentralWarehouseIntransitRow[],
  safetyStockRows: WeeklySafetyStockRow[]
): WeeklyP4Row[] {
  const skuInventory = indexBySum(
    inventoryRows.filter((row) => AVAILABLE_SLOCS.has((row.sloc ?? "").trim().toUpperCase())),
    (row) => row.material,
    (row) => row.unrestrictedQty
  );
  const skuIntransit = indexBySum(
    intransitRows,
    (row) => row.material,
    (row) => row.intransitQty
  );
  const skuSafetyStock = indexBySum(
    safetyStockRows,
    (row) => row.sku,
    (row) => row.safetyStockQty
  );

  return rows.map((row) => {
    const yaCentralWarehouseInventoryQty = skuInventory.get(row.sku) ?? 0;
    const ybIntransitQty = skuIntransit.get(row.sku) ?? 0;
    const ycSafetyStockQty = skuSafetyStock.get(row.sku) ?? 5;

    return {
      ...row,
      yaCentralWarehouseInventoryQty,
      ybIntransitQty,
      ycSafetyStockQty,
      yCentralWarehouseAvailableQty: clampMinZero(
        subtract10(add10(yaCentralWarehouseInventoryQty, ybIntransitQty), ycSafetyStockQty)
      ),
    };
  });
}
