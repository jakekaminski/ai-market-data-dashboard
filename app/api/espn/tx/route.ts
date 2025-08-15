import { fetchLeague } from "@/lib/espn/fetchers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await fetchLeague(["mPendingTransactions"]);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=120",
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
