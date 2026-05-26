import { NextResponse } from "next/server";
import { filterFixtures, getFixtures } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fixtures = await getFixtures();
  const data = filterFixtures(fixtures, searchParams.get("q"));

  return NextResponse.json({
    count: data.length,
    generatedAt: new Date().toISOString(),
    source: "openfootball-worldcup-2026",
    data
  });
}
