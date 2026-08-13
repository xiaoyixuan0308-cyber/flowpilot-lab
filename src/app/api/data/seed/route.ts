import { NextResponse } from "next/server";
import { seedOdsData } from "@/server/services/import";

export async function POST() {
  const result = await seedOdsData();
  return NextResponse.json(result);
}
