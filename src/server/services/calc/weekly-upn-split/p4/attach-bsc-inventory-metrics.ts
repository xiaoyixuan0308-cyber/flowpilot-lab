import { add10, clampMinZero, indexBySum, subtract10 } from "../weekly-upn-split.helpers";
import type {
  WeeklyBscInventoryRow,
  WeeklyBscIntransitRow,
  WeeklyP3Row,
  WeeklyP4Row,
  WeeklySafetyStockRow,
} from "../weekly-upn-split.types";

const AVAILABLE_SLOCS = new Set(["Y001", "0001"]);

export function attachBscInventoryMetrics(
  rows: WeeklyP3Row[],
  inventoryRows: WeeklyBscInventoryRow[],
  intransitRows: WeeklyBscIntransitRow[],
  safetyStockRows: WeeklySafetyStockRow[]
): WeeklyP4Row[] {
  const upnInventory = indexBySum(
    inventoryRows.filter((row) => AVAILABLE_SLOCS.has((row.sloc ?? "").trim().toUpperCase())),
    (row) => row.material,
    (row) => row.unrestrictedQty
  );
  const upnIntransit = indexBySum(
    intransitRows,
    (row) => row.material,
    (row) => row.intransitQty
  );
  const upnSafetyStock = indexBySum(
    safetyStockRows,
    (row) => row.upn,
    (row) => row.safetyStockQty
  );

  return rows.map((row) => {
    const yaBscInventoryQty = upnInventory.get(row.upn) ?? 0;
    const ybIntransitQty = upnIntransit.get(row.upn) ?? 0;
    const ycSafetyStockQty = upnSafetyStock.get(row.upn) ?? 5;

    return {
      ...row,
      yaBscInventoryQty,
      ybIntransitQty,
      ycSafetyStockQty,
      yBscAvailableQty: clampMinZero(
        subtract10(add10(yaBscInventoryQty, ybIntransitQty), ycSafetyStockQty)
      ),
    };
  });
}
