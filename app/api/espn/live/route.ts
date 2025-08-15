import { fetchLeague } from "@/lib/espn/fetchers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await fetchLeague(["mLiveScoring"]);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
