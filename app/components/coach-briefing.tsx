import { buildCoachBrief } from "@/lib/coach/buildBrief";
import { buildImpliedDvpFromProjections } from "@/lib/coach/dvp";
import { summarizeCoachBrief } from "@/lib/coach/summarize";
import { getStaticBundle, getWeeklyBundle } from "@/lib/espn/fetchers";
import { transformWeeklyToFantasyDTO } from "@/lib/espn/helpers";

import { CoachBriefLLM } from "@/types/coach";
import CoachBriefingClient from "./coach-briefing.client";

export async function refreshCoachBriefAction(
  _prev: { ai: CoachBriefLLM | null; error: string | null },
  formData: FormData
): Promise<{ ai: CoachBriefLLM | null; error: string | null }> {
  "use server";
  try {
    const raw = formData.get("deterministic");
    if (!raw || typeof raw !== "string") {
      return { ai: null, error: "No input provided" };
    }
    const deterministic = JSON.parse(raw);
    // Call your LLM summarizer; make sure it returns CoachBriefLLM
    const ai = await summarizeCoachBrief(deterministic);
    // Validate (optional if summarize already Zod-validates)
    return { ai, error: null };
  } catch (e: unknown) {
    return {
      ai: null,
      error: (e as Error).message ?? "Failed to generate coach brief.",
    };
  }
}

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

  // Render both: AI text up top, then deterministic details collapsible for transparency
  return (
    <CoachBriefingClient
      deterministicData={deterministic}
      refreshAction={refreshCoachBriefAction}
    />
  );
}
