import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCoachBrief } from "@/lib/coach/buildBrief";
import { buildImpliedDvpFromProjections } from "@/lib/coach/dvp";
import { summarizeCoachBrief } from "@/lib/coach/summarize";
import { getStaticBundle, getWeeklyBundle } from "@/lib/espn/fetchers";
import { transformWeeklyToFantasyDTO } from "@/lib/espn/helpers";
import { Sparkle } from "lucide-react";

export default async function CoachBriefing({
  week,
  teamId,
  risk,
  live,
}: {
  week: number;
  teamId: number;
  risk: number;
  live: boolean;
}) {
  const [weekly, statics] = await Promise.all([
    getWeeklyBundle(),
    getStaticBundle(),
  ]);

  const weeklyDto = transformWeeklyToFantasyDTO(weekly, statics.teams);

  const selectedWeek = week || weeklyDto.week;

  const dvpRanks = buildImpliedDvpFromProjections(weeklyDto, selectedWeek);

  // opponent lookup (you already have this)
  const matchup = weeklyDto.matchups.find(
    (m) =>
      (m.week ?? weeklyDto.week) === selectedWeek &&
      (m.home.teamId === teamId || m.away.teamId === teamId)
  );
  const opponentTeamId = matchup
    ? matchup.home.teamId === teamId
      ? matchup.away.teamId
      : matchup.home.teamId
    : undefined;

  const posRatings =
    opponentTeamId && dvpRanks[opponentTeamId]
      ? Object.fromEntries(
          Object.entries(dvpRanks[opponentTeamId]).map(([pos, rank]) => [
            pos,
            { defenseRankAgainst: rank as number },
          ])
        )
      : {};

  const deterministic = buildCoachBrief({
    dto: weeklyDto,
    teams: statics.teams,
    week,
    teamId,
    risk,
    live,
    posRatings,
  });

  // Cache key: leagueId + teamId + week + risk + live + hash(deterministic.startSit/mismatches)
  let ai = null;
  try {
    ai = await summarizeCoachBrief(deterministic);
  } catch (error: unknown) {
    ai = {
      headline: `AI Summary Unavailable: ${(error as Error).message}`,
      bullets: [],
      moves: [],
    };
  }

  // Render both: AI text up top, then deterministic details collapsible for transparency
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkle className="h-4 w-4" /> AI Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <h2 className="text-lg font-semibold">{ai.headline}</h2>
        <ul className="list-disc list-inside">
          {ai.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>

        {/* optional extras */}
        {!!ai.moves?.length && (
          <>
            <div className="mt-3 text-sm font-medium">Suggested Moves</div>
            <ul className="list-disc list-inside text-sm">
              {ai.moves.map((m, i) => (
                <li key={i}>
                  {m.label}
                  {m.reason ? ` — ${m.reason}` : ""}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* transparency toggle */}
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Show data used
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-2 text-xs">
            {JSON.stringify(deterministic, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
