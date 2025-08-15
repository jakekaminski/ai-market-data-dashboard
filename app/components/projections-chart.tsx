import { getStaticBundle } from "@/lib/espn/fetchers";
import { Team } from "@/types/fantasy";
import ProjectionsChartClient from "./projections-chart.client";

export default async function ProjectionsChart({
  weeks = 14,
}: {
  weeks?: number;
}) {
  let teamNames: string[] = [];
  try {
    const statics = await getStaticBundle();
    const teams = Array.isArray(statics?.teams) ? statics.teams : [];
    teamNames = teams.map((t: Team) =>
      (
        t.name ||
        `${t.location ?? "Team"} ${t.nickname ?? ""}` ||
        `Team ${t.id ?? ""}`
      ).trim()
    );
  } catch {
    // ignore, we'll fall back to dummy
  }
  if (teamNames.length === 0) {
    teamNames = Array.from({ length: 10 }, (_, i) => `Team ${i + 1}`);
  }

  const weekList = Array.from({ length: weeks }, (_, i) => i + 1);
  const data = weekList.map((w) => {
    const row: Record<string, number | string> = { week: w };
    teamNames.forEach((name, idx) => {
      const base = 110 + (idx % 3) * 5; // slight team-to-team separation
      const swing = 12 * Math.sin((idx + 1) * 0.7 + w / 1.6);
      const value = Math.round((base + swing) * 10) / 10;
      row[name] = value;
    });
    return row;
  });

  return <ProjectionsChartClient data={data} teams={teamNames} height={360} />;
}
