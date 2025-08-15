import { fetchLeague } from "@/lib/espn/fetchers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await fetchLeague([
      "mSettings",
      "mTeam",
      "mNav",
      "mPositionalRatings",
    ]);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "max-age=86400" },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
