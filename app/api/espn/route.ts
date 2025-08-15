import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    endpoints: [
      "/api/espn/static",
      "/api/espn/weekly",
      "/api/espn/season",
      "/api/espn/live",
      "/api/espn/tx",
    ],
    hint: "Append ?pretty=1 for indented JSON",
  });
}
