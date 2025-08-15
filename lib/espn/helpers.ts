import type {
  FantasyDataDTO,
  LiveBundle,
  MatchupDTO,
  PlayerCard,
  PlayerStatLine,
  RosterEntry,
  ScheduleEntry,
  SeasonBundle,
  Team,
  WeeklyBundle,
} from "@/types/fantasy";
import { YEAR } from "./fetchers";

/**
 * Build a quick lookup from teamId -> Team.
 */
function buildTeamIndex(teams: Team[] = []): Record<number, Team> {
  return Object.fromEntries(teams.map((t) => [t.id, t]));
}

/**
 * Derive a friendly team name.
 */
function teamName(t?: Team, teamId?: number, teams?: Team[]): string {
  if (!t && teamId && teams) {
    const team = teams.find((team) => team.id === teamId);
    if (team) return team.name ?? "Unknown Team";
  }
  if (!t) return "Unknown Team";
  const name = t.name ?? `${t.location ?? ""} ${t.nickname ?? ""}`.trim();
  return name || `Team ${t.id}`;
}

/**
 * Map a team's current roster entries to compact PlayerCard DTOs.
 * NOTE: Weekly bundle itself does NOT include rosters; we pull them from the provided Team objects.
 */
function mapRosterToCards(
  entries: RosterEntry[] | undefined,
  week?: number
): PlayerCard[] {
  if (!entries?.length) return [];
  return entries.map((e) => {
    const p = e.playerPoolEntry.player;
    const name =
      p.fullName || `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();

    // Pull per-week projection/actual from player.stat lines when present
    const statLines = Array.isArray(p.stats) ? p.stats : [];
    const isForWeek = (s: PlayerStatLine) =>
      typeof week === "number" ? s?.scoringPeriodId === week : true;

    const isForSeason = (s: PlayerStatLine) => YEAR === Number(s.seasonId);

    // Actuals: statSourceId = 0
    const actual = statLines.find(
      (s) => s?.statSourceId === 0 && isForWeek(s) && isForSeason(s)
    );

    // Projections: statSourceId = 1
    const proj = statLines.find(
      (s) => s?.statSourceId === 1 && isForWeek(s) && isForSeason(s)
    );

    const appliedFrom = (s: PlayerStatLine): number => {
      // Prefer appliedTotal; else sum appliedStats; else sum stats
      if (typeof s.appliedTotal === "number") return s.appliedTotal;
      const vals =
        (s.appliedStats && Object.values(s.appliedStats)) ||
        (s.stats && Object.values(s.stats)) ||
        [];
      return (vals as number[]).reduce((a, b) => a + (Number(b) || 0), 0);
    };

    const projectedPoints = (proj ? appliedFrom(proj) : undefined) ?? 0;

    const actualPoints =
      (actual ? appliedFrom(actual) : undefined) ??
      e.playerPoolEntry.appliedStatTotal ??
      0;

    return {
      id: p.id,
      name,
      team: p.proTeamAbbreviation ?? "",
      position: String(p.defaultPositionId),
      projectedPoints,
      actualPoints,
      bench: e.lineupSlotId === 20,
    };
  });
}

/**
 * Transform a Weekly ESPN bundle + Teams into your FantasyDataDTO.
 * This mirrors the server logic you prototyped in getFantasyData().
 *
 * @param weekly - WeeklyBundle (has schedule + current scoringPeriodId)
 * @param teams  - Team[] from Static bundle (needed for names/rosters)
 */
export function transformWeeklyToFantasyDTO(
  weekly: WeeklyBundle,
  teams: Team[] = []
): FantasyDataDTO {
  const week = weekly.scoringPeriodId ?? 0;
  const idx = buildTeamIndex(teams);
  const schedule: ScheduleEntry[] = weekly.schedule ?? [];

  const matchups: MatchupDTO[] = schedule.map((m) => {
    const homeTeam = idx[m.home.teamId!];
    const awayTeam = idx[m.away.teamId!];

    const homeRoster = mapRosterToCards(homeTeam?.roster?.entries, week);
    const awayRoster = mapRosterToCards(awayTeam?.roster?.entries, week);

    const homeTotalProjectedPoints = homeRoster
      .map((p) => (!p.bench ? p.projectedPoints : 0))
      .reduce((a, b) => a + b, 0);
    const awayTotalProjectedPoints = awayRoster
      .map((p) => (!p.bench ? p.projectedPoints : 0))
      .reduce((a, b) => a + b, 0);

    return {
      week: m.matchupPeriodId ?? week,
      matchupId: m.matchupId ?? m.id,
      homeTeam: teamName(homeTeam),
      awayTeam: teamName(awayTeam),
      homeScore: m.home.totalPoints ?? 0,
      awayScore: m.away.totalPoints ?? 0,
      homeRoster,
      awayRoster,
      home: {
        name: teamName(homeTeam),
        teamId: m.home.teamId!,
        totalPoints: m.home.totalPoints ?? 0,
        totalProjectedPoints: homeTotalProjectedPoints ?? 0,
        totalProjectedPointsLive: m.home.totalProjectedPointsLive ?? 0,
        roster: homeRoster,
      },
      away: {
        name: teamName(awayTeam),
        teamId: m.away.teamId!,
        totalPoints: m.away.totalPoints ?? 0,
        totalProjectedPoints: awayTotalProjectedPoints ?? 0,
        totalProjectedPointsLive: m.away.totalProjectedPointsLive ?? 0,
        roster: awayRoster,
      },
    };
  });

  return { week, matchups, teams };
}

/**
 * Transforms the ESPN season bundle into the same FantasyDataDTO shape as weekly,
 * but includes matchups for *all* weeks.
 */
export function transformSeasonToFantasyDTO(
  seasonBundle: SeasonBundle,
  teams: Team[]
): FantasyDataDTO {
  const seasonId = seasonBundle.seasonId;
  const allMatchups: MatchupDTO[] = [];

  // ESPN's season bundle has a `schedule` array with matchups for all periods
  for (const sched of seasonBundle.schedule ?? []) {
    const homeRoster = mapRosterToCards(
      sched.home.rosterForCurrentScoringPeriod?.entries
    );
    const awayRoster = mapRosterToCards(
      sched.away.rosterForCurrentScoringPeriod?.entries
    );

    const homeTotalProjectedPoints = homeRoster
      .map((p) => (!p.bench ? p.projectedPoints : 0))
      .reduce((a, b) => a + b, 0);
    const awayTotalProjectedPoints = awayRoster
      .map((p) => (!p.bench ? p.projectedPoints : 0))
      .reduce((a, b) => a + b, 0);

    allMatchups.push({
      matchupId: sched.id,
      week: sched.matchupPeriodId ?? 0,
      home: {
        name: teamName(undefined, sched.home?.teamId, teams),
        teamId: sched.home?.teamId ?? -1,
        totalPoints: sched.home?.totalPoints ?? 0,
        totalProjectedPoints: homeTotalProjectedPoints,
      },
      away: {
        name: teamName(undefined, sched.away?.teamId, teams),
        teamId: sched.away?.teamId ?? -1,
        totalPoints: sched.away?.totalPoints ?? 0,
        totalProjectedPoints: awayTotalProjectedPoints,
      },
    });
  }

  return {
    seasonId,
    week: seasonBundle.status?.latestScoringPeriod ?? 1,
    teams,
    matchups: allMatchups,
  };
}

/**
 * Normalize live scoring for lightweight widgets.
 * Tries to extract live totals if available; gracefully falls back.
 *
 * @returns an object with per-team live/actual totals you can chart.
 */
export function transformLiveData(
  live: LiveBundle,
  teams: Team[] = []
): {
  week: number;
  teams: Array<{
    teamId: number;
    name: string;
    totalPoints: number;
    totalPointsLive: number;
  }>;
} {
  const idx = buildTeamIndex(teams);
  const week = live.scoringPeriodId ?? 0;

  // Some live responses may include schedule-like structures or aggregates.
  // We'll attempt to read from any schedule in the object; if not present, return empty array with names.
  const buckets: Record<
    number,
    {
      teamId: number;
      name: string;
      totalPoints: number;
      totalPointsLive: number;
    }
  > = {};

  const maybeSchedules: any[] = Array.isArray((live as any).schedule)
    ? // @ts-ignore
      (live as any).schedule
    : [];

  for (const s of maybeSchedules as ScheduleEntry[]) {
    const pairs: Array<
      [
        "home" | "away",
        number | undefined,
        number | undefined,
        number | undefined
      ]
    > = [
      ["home", s.home.teamId, s.home.totalPoints, s.home.totalPointsLive],
      ["away", s.away.teamId, s.away.totalPoints, s.away.totalPointsLive],
    ];

    for (const [, teamIdRaw, total, liveTotal] of pairs) {
      const teamId = typeof teamIdRaw === "number" ? teamIdRaw : -1;
      if (teamId < 0) continue;
      const name = teamName(idx[teamId]);
      const prev = buckets[teamId] ?? {
        teamId,
        name,
        totalPoints: 0,
        totalPointsLive: 0,
      };
      buckets[teamId] = {
        teamId,
        name,
        totalPoints: Math.max(prev.totalPoints, total ?? 0),
        totalPointsLive: Math.max(
          prev.totalPointsLive,
          liveTotal ?? total ?? 0
        ),
      };
    }
  }

  // If we didn't find anything, at least return the teams list with zeros so charts render.
  if (Object.keys(buckets).length === 0) {
    for (const t of teams) {
      buckets[t.id] = {
        teamId: t.id,
        name: teamName(t),
        totalPoints: 0,
        totalPointsLive: 0,
      };
    }
  }

  return {
    week,
    teams: Object.values(buckets).sort((a, b) => a.teamId - b.teamId),
  };
}
