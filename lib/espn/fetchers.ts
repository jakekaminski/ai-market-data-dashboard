import {
  PositionalRatingsBundle,
  SeasonBundle,
  StaticBundle,
  TeamsView,
  WeeklyBundle,
} from "@/types/fantasy";

export const YEAR = 2025;
export const LEAGUE_ID = 1820127949;
export const TEAM_ID = 11;
export const SWID = process.env.ESPN_SWID;
export const ESPNS2 = process.env.ESPN_S2;

export const ESPN_BASE = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${YEAR}/segments/0/leagues/${LEAGUE_ID}`;

export function buildLeagueUrl(views: string[]): string {
  const viewParam = views.map((view) => `view=${view}`).join("&");
  return `${ESPN_BASE}?${viewParam}`;
}

export async function fetchLeague<T>(views: string[]): Promise<T> {
  const url = buildLeagueUrl(views);
  const res = await fetch(url, {
    headers: {
      "x-fantasy-filter": "{}",
      Cookie: `SWID=${SWID}; espn_s2=${ESPNS2}`,
    },
    cache: "no-cache",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch league data: ${res.statusText}`);
  }
  return res.json();
}

export async function getStaticBundle() {
  return fetchLeague<StaticBundle>([
    "mSettings",
    "mTeam",
    "mRoster",
    "mMatchup",
  ]);
}

export async function getWeeklyBundle() {
  return fetchLeague<WeeklyBundle>([
    "mMatchup",
    "mScoreboard",
    "mMatchupScore",
  ]);
}

export async function getPositionalRatings() {
  return fetchLeague<PositionalRatingsBundle>(["mPositionalRatings"]);
}

export async function getTeam() {
  return fetchLeague<TeamsView>(["mTeam"]);
}

export async function getSeasonBundle() {
  return fetchLeague<SeasonBundle>(["mMatchupScore"]);
}
