import { NextResponse } from "next/server";
import { resetTestData } from "@/server/services/import";

export async function POST() {
  const result = await resetTestData();
  return NextResponse.json(result);
}
