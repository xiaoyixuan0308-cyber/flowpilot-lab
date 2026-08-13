import { NextRequest, NextResponse } from "next/server";
import { seedScaleData } from "@/server/services/import";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const periodMonth =
    typeof body?.periodMonth === "string" && body.periodMonth.trim()
      ? body.periodMonth.trim()
      : undefined;
  const lpCount =
    typeof body?.lpCount === "number" && body.lpCount > 0 ? body.lpCount : undefined;
  const pl5Count =
    typeof body?.pl5Count === "number" && body.pl5Count > 0 ? body.pl5Count : undefined;
  const upnPerLpPl5 =
    typeof body?.upnPerLpPl5 === "number" && body.upnPerLpPl5 > 0
      ? body.upnPerLpPl5
      : undefined;

  const result = await seedScaleData(periodMonth, { lpCount, pl5Count, upnPerLpPl5 });
  return NextResponse.json(result);
}
