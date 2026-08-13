import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TrendType =
  | "t2-purchase"
  | "inventory"
  | "fcst-lp-pl5"
  | "fcst-t2-pl5"
  | "bu-amount"
  | "allocation"
  | "dealer-dn"
  | "dealer-open-order"
  | "bsc-inventory"
  | "bsc-intransit"
  | "safety-stock"
  | "purchase-price"
  | "calendar-pattern";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as TrendType | null;
    const scBu = searchParams.get("sc_bu");
    const pl5Code = searchParams.get("pl5_code");
    const dealerlpcode = searchParams.get("dealerlpcode");

    if (!type) {
      return NextResponse.json(
        { error: "缺少 type 参数" },
        { status: 400 },
      );
    }

    switch (type) {
      case "t2-purchase": {
        const rows = await prisma.ods_t2_purchase_monthly.findMany({
          where: {
            ...(scBu ? { sc_bu: scBu } : {}),
            ...(pl5Code ? { pl5_code: pl5Code } : {}),
          },
          orderBy: [{ year: "asc" }, { month: "asc" }],
          take: 5000,
        });
        const periods = new Set<string>();
        const seriesMap = new Map<string, Map<string, number>>();
        const seriesLabels = new Map<string, string>();

        for (const row of rows) {
          const period = `${row.year}-${row.month.padStart(2, "0")}`;
          periods.add(period);
          const key = row.pl5_code || "unknown";
          seriesLabels.set(key, row.pl5_name || key);
          if (!seriesMap.has(key)) seriesMap.set(key, new Map());
          seriesMap.get(key)!.set(
            period,
            (seriesMap.get(key)!.get(period) ?? 0) + Number(row.qty),
          );
        }

        const sortedPeriods = Array.from(periods).sort();
        const series: Record<string, number[]> = {};
        for (const [key, periodMap] of seriesMap) {
          series[key] = sortedPeriods.map((p) => periodMap.get(p) ?? 0);
        }

        return NextResponse.json({ periods: sortedPeriods, series, seriesLabels: Object.fromEntries(seriesLabels) });
      }

      case "inventory": {
        const rows = await prisma.ods_inventory_dealer_upn.findMany({
          where: {
            ...(dealerlpcode ? { dealerlpcode } : {}),
          },
          orderBy: [{ year: "asc" }, { month: "asc" }],
          take: 5000,
        });
        const periods = new Set<string>();
        const seriesMap = new Map<string, Map<string, number>>();
        const seriesLabels = new Map<string, string>();

        for (const row of rows) {
          const period = `${row.year}-${row.month.padStart(2, "0")}`;
          periods.add(period);
          const key = dealerlpcode ? row.upn : row.dealerlpcode || "unknown";
          seriesLabels.set(key, dealerlpcode ? row.upn : row.dealerlpname || key);
          if (!seriesMap.has(key)) seriesMap.set(key, new Map());
          seriesMap.get(key)!.set(
            period,
            (seriesMap.get(key)!.get(period) ?? 0) + Number(row.qty),
          );
        }

        const sortedPeriods = Array.from(periods).sort();
        const series: Record<string, number[]> = {};
        for (const [key, periodMap] of seriesMap) {
          series[key] = sortedPeriods.map((p) => periodMap.get(p) ?? 0);
        }

        return NextResponse.json({ periods: sortedPeriods, series, seriesLabels: Object.fromEntries(seriesLabels) });
      }

      case "fcst-lp-pl5": {
        const rows = await prisma.ods_fcst_lp_pl5_monthly.findMany({
          where: {
            ...(scBu ? { sc_bu: scBu } : {}),
            ...(pl5Code ? { pl5_code: pl5Code } : {}),
          },
          orderBy: [{ year: "asc" }, { month: "asc" }],
          take: 5000,
        });
        const periods = new Set<string>();
        const seriesMap = new Map<string, Map<string, number>>();
        const seriesLabels = new Map<string, string>();

        for (const row of rows) {
          const period = `${row.year}-${row.month.padStart(2, "0")}`;
          periods.add(period);
          const key = row.pl5_code || "unknown";
          seriesLabels.set(key, row.pl5_name || key);
          if (!seriesMap.has(key)) seriesMap.set(key, new Map());
          seriesMap.get(key)!.set(
            period,
            (seriesMap.get(key)!.get(period) ?? 0) + Number(row.fcst_qty),
          );
        }

        const sortedPeriods = Array.from(periods).sort();
        const series: Record<string, number[]> = {};
        for (const [key, periodMap] of seriesMap) {
          series[key] = sortedPeriods.map((p) => periodMap.get(p) ?? 0);
        }

        return NextResponse.json({ periods: sortedPeriods, series, seriesLabels: Object.fromEntries(seriesLabels) });
      }

      case "fcst-t2-pl5": {
        const rows = await prisma.ods_fcst_t2_pl5_monthly.findMany({
          where: {
            ...(scBu ? { sc_bu: scBu } : {}),
            ...(pl5Code ? { pl5_code: pl5Code } : {}),
          },
          orderBy: [{ year: "asc" }, { month: "asc" }],
          take: 5000,
        });
        const periods = new Set<string>();
        const seriesMap = new Map<string, Map<string, number>>();
        const seriesLabels = new Map<string, string>();

        for (const row of rows) {
          const period = `${row.year}-${row.month.padStart(2, "0")}`;
          periods.add(period);
          const key = row.pl5_code || "unknown";
          seriesLabels.set(key, row.pl5_name || key);
          if (!seriesMap.has(key)) seriesMap.set(key, new Map());
          seriesMap.get(key)!.set(
            period,
            (seriesMap.get(key)!.get(period) ?? 0) + Number(row.fcst_qty),
          );
        }

        const sortedPeriods = Array.from(periods).sort();
        const series: Record<string, number[]> = {};
        for (const [key, periodMap] of seriesMap) {
          series[key] = sortedPeriods.map((p) => periodMap.get(p) ?? 0);
        }

        return NextResponse.json({ periods: sortedPeriods, series, seriesLabels: Object.fromEntries(seriesLabels) });
      }

      case "bu-amount": {
        const timeSpan = searchParams.get("time_span") === "month" ? "month" : "week";
        const rows = await prisma.ods_bu_pattern_amount_weekly.findMany({
          where: {
            ...(scBu ? { sc_bu: scBu } : {}),
          },
          orderBy: { period_week: "asc" },
          take: 2000,
        });
        const periods = new Set<string>();
        const actualMap = new Map<string, number>();
        const targetMap = new Map<string, number>();

        for (const row of rows) {
          const period =
            timeSpan === "month"
              ? row.period_month.toISOString().slice(0, 7)
              : row.period_week.toISOString().slice(0, 10);
          periods.add(period);
          actualMap.set(
            period,
            (actualMap.get(period) ?? 0) + Number(row.actual_amount ?? 0),
          );
          targetMap.set(
            period,
            (targetMap.get(period) ?? 0) + Number(row.month_target_amount ?? 0),
          );
        }

        const sortedPeriods = Array.from(periods).sort();
        return NextResponse.json({
          periods: sortedPeriods,
          series: {
            actual_amount: sortedPeriods.map((p) => actualMap.get(p) ?? 0),
            month_target_amount: sortedPeriods.map((p) => targetMap.get(p) ?? 0),
          },
          granularity: timeSpan,
        });
      }

      case "allocation": {
        const rows = await prisma.ods_lp_pl5_allocate_monthly.findMany({
          orderBy: { period_month: "asc" },
          take: 5000,
        });
        const periods = new Set<string>();
        const seriesMap = new Map<string, Map<string, number>>();
        const seriesLabels = new Map<string, string>();

        for (const row of rows) {
          const period = String(row.period_month).slice(0, 10);
          periods.add(period);
          const key = row.pl5_code || "unknown";
          seriesLabels.set(key, row.pl5_name || key);
          if (!seriesMap.has(key)) seriesMap.set(key, new Map());
          seriesMap.get(key)!.set(
            period,
            (seriesMap.get(key)!.get(period) ?? 0) + Number(row.allocate_qty),
          );
        }

        const sortedPeriods = Array.from(periods).sort();
        const series: Record<string, number[]> = {};
        for (const [key, periodMap] of seriesMap) {
          series[key] = sortedPeriods.map((p) => periodMap.get(p) ?? 0);
        }

        return NextResponse.json({ periods: sortedPeriods, series, seriesLabels: Object.fromEntries(seriesLabels) });
      }

      case "dealer-dn": {
        const rows = await prisma.ods_dealer_upn_dn.findMany({
          orderBy: { created_on: "asc" },
          take: 5000,
        });
        const periods = new Set<string>();
        const seriesMap = new Map<string, Map<string, number>>();

        for (const row of rows) {
          const period = String(row.created_on).slice(0, 10);
          periods.add(period);
          const key = row.material || "unknown";
          if (!seriesMap.has(key)) seriesMap.set(key, new Map());
          seriesMap.get(key)!.set(
            period,
            (seriesMap.get(key)!.get(period) ?? 0) + Number(row.delivery_qty ?? 0),
          );
        }

        const sortedPeriods = Array.from(periods).sort();
        const series: Record<string, number[]> = {};
        for (const [key, periodMap] of seriesMap) {
          series[key] = sortedPeriods.map((p) => periodMap.get(p) ?? 0);
        }

        return NextResponse.json({ periods: sortedPeriods, series });
      }

      case "dealer-open-order": {
        const rows = await prisma.ods_dealer_upn_open_order.findMany({
          take: 5000,
        });
        const aggMap = new Map<string, number>();
        for (const row of rows) {
          const key = row.material || "unknown";
          aggMap.set(key, (aggMap.get(key) ?? 0) + Number(row.open_qty ?? 0));
        }
        const data = Array.from(aggMap.entries())
          .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
          .sort((a, b) => b.value - a.value);
        return NextResponse.json({ data });
      }

      case "bsc-inventory": {
        const rows = await prisma.ods_bsc_upn_inventory.findMany({
          take: 5000,
        });
        const aggMap = new Map<string, number>();
        for (const row of rows) {
          const key = row.material || "unknown";
          aggMap.set(key, (aggMap.get(key) ?? 0) + Number(row.unrestricted_qty ?? 0));
        }
        const data = Array.from(aggMap.entries())
          .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
          .sort((a, b) => b.value - a.value);
        return NextResponse.json({ data });
      }

      case "bsc-intransit": {
        const rows = await prisma.ods_bsc_upn_intransit.findMany({
          orderBy: { forecast_date: "asc" },
          take: 5000,
        });
        const periods = new Set<string>();
        const seriesMap = new Map<string, Map<string, number>>();

        for (const row of rows) {
          const period = String(row.forecast_date).slice(0, 10);
          periods.add(period);
          const key = row.material || "unknown";
          if (!seriesMap.has(key)) seriesMap.set(key, new Map());
          seriesMap.get(key)!.set(
            period,
            (seriesMap.get(key)!.get(period) ?? 0) + Number(row.intransit_qty ?? 0),
          );
        }

        const sortedPeriods = Array.from(periods).sort();
        const series: Record<string, number[]> = {};
        for (const [key, periodMap] of seriesMap) {
          series[key] = sortedPeriods.map((p) => periodMap.get(p) ?? 0);
        }

        return NextResponse.json({ periods: sortedPeriods, series });
      }

      case "safety-stock": {
        const rows = await prisma.ods_upn_safety_stock_manual.findMany({
          take: 1000,
        });
        const data = rows.map((row) => ({
          name: row.upn || "unknown",
          value: Number(row.safety_stock_qty ?? 0),
        }));
        data.sort((a, b) => b.value - a.value);
        return NextResponse.json({ data });
      }

      case "purchase-price": {
        const rows = await prisma.ods_lp_upn_purchase_price.findMany({
          take: 1000,
        });
        const data = rows.map((row) => ({
          name: row.upn || "unknown",
          value: Number(row.bsc_std_sell_price ?? 0),
        }));
        data.sort((a, b) => b.value - a.value);
        return NextResponse.json({ data });
      }

      case "calendar-pattern": {
        const rows = await prisma.ods_calendar_pattern_weekly.findMany({
          orderBy: { week_start_date: "asc" },
          take: 2000,
        });
        const periods: string[] = [];
        const prevSeries: number[] = [];
        const currSeries: number[] = [];

        for (const row of rows) {
          periods.push(row.week_start_date.toISOString().slice(0, 10));
          prevSeries.push(Number(row.prev_week_pattern_pct ?? 0));
          currSeries.push(Number(row.current_week_pattern_pct ?? 0));
        }

        return NextResponse.json({
          periods,
          series: {
            prev_week_pattern_pct: prevSeries,
            current_week_pattern_pct: currSeries,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `未知 type: ${type}` },
          { status: 400 },
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 },
    );
  }
}
