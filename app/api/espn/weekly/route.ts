import { getWeeklyBundle } from "@/lib/espn/fetchers";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime (cookies/env ok)

export async function GET(request: Request) {
  try {
    const data = await getWeeklyBundle();
    // Optional pretty print toggle: /api/espn/weekly?pretty=1
    const { searchParams } = new URL(request.url);
    const pretty = searchParams.get("pretty") === "1";

    // cache control for dev vs prod; change as you like
    const headers = { "Cache-Control": "no-store" };

    // NextResponse.json() is fine; if you want pretty JSON, serialize manually:
    return pretty
      ? new NextResponse(JSON.stringify(data, null, 2), {
          headers: {
            ...headers,
            "Content-Type": "application/json; charset=utf-8",
          },
        })
      : NextResponse.json(data, { headers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
