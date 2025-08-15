import { fetchLeague } from "@/lib/espn/fetchers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await fetchLeague(["mMatchupScore"]);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "max-age=600" },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
