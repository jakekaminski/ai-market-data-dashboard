import WinProbabilityChartClient, {
  ChartItem,
} from "@/components/charts/win-probability-chart.client";
import { getStaticBundle, getWeeklyBundle } from "@/lib/espn/fetchers";
import { transformWeeklyToFantasyDTO } from "@/lib/espn/helpers";
import type { FantasyDataDTO, Team } from "@/types/fantasy";

export type WinProbInputs = {
  week?: number; // selected week
  teamId?: number | null; // selected team (numeric ESPN teamId) or null
  risk?: number; // 0..100 (risk tolerance from slider)
  live?: boolean; // true => weight projections a bit more (or later, use live totals)
};

/** -------------------------------------------------------
 * Simple, defensible win probability model
 * --------------------------------------------------------
 * p = logistic( (diff + tilt) / uncertainty )
 * diff        = homeScore - awayScore
 * tilt        = 0.35 * (remHome - remAway)
 * uncertainty = sqrt(remHome + remAway + 8)
 */
function computeWinProb(args: {
  homeScore: number;
  awayScore: number;
  homeRemaining: number;
  awayRemaining: number;
}) {
  const { homeScore, awayScore, homeRemaining, awayRemaining } = args;
  const diff = (homeScore ?? 0) - (awayScore ?? 0);
  const tilt = 0.35 * ((homeRemaining ?? 0) - (awayRemaining ?? 0));
  const uncertainty = Math.sqrt(Math.max(homeRemaining + awayRemaining, 0) + 8);
  const z = (diff + tilt) / (uncertainty || 1);
  const p = 1 / (1 + Math.exp(-z));
  return Math.min(0.99, Math.max(0.01, p));
}

export default async function WinProbabilityChart({
  week: selectedWeekInput,
  teamId: selectedTeamIdInput,
  risk: riskInput = 50,
  live: liveInput = false,
}: WinProbInputs = {}) {
  // Fetch weekly + static bundles on the server
  const [weekly, statics] = await Promise.all([
    getWeeklyBundle(),
    getStaticBundle(),
  ]);

  const teams = (statics.teams ?? []) as Team[];

  // Transform into the DTO your components expect
  const dto: FantasyDataDTO = transformWeeklyToFantasyDTO(weekly, teams);

  // Resolve filters
  const selectedWeek = selectedWeekInput || dto.week;
  const teamId =
    typeof selectedTeamIdInput === "number" ? selectedTeamIdInput : null;
  const risk = Math.min(100, Math.max(0, riskInput));
  const useLiveTotals = !!liveInput;

  // Filter to the selected week
  const matchupsThisWeek = dto.matchups.filter(
    (m) => (m.week ?? dto.week) === selectedWeek
  );

  // Find the matchup containing the selected team; if team is null, choose the first
  const target = teamId
    ? matchupsThisWeek.find(
        (m) => m.home.teamId === teamId || m.away.teamId === teamId
      )
    : matchupsThisWeek[0];

  let items: ChartItem[] = [];

  if (target) {
    // Remaining projections (projected - actual). If you wire live totals later, swap in here.
    const homeProj = useLiveTotals
      ? target.home.totalProjectedPointsLive ?? 0
      : target.home.totalProjectedPoints;
    const awayProj = useLiveTotals
      ? target.away.totalProjectedPointsLive ?? 0
      : target.away.totalProjectedPoints;
    const homeAct = target.home.totalPoints;
    const awayAct = target.away.totalPoints;

    // Map risk (0..100) to tilt factor, and damp a bit when not in live mode.
    const tiltFactor = 0.15 + (risk / 100) * 0.45; // 0.15..0.60
    const liveDamp = useLiveTotals ? 1 : 0.7;

    const pHome = computeWinProb({
      homeScore: target.home.totalPoints,
      awayScore: target.away.totalPoints,
      homeRemaining: liveDamp * Math.max(homeProj - homeAct, 0),
      awayRemaining: liveDamp * Math.max(awayProj - awayAct, 0),
    });

    items = [
      {
        key: `${target.home.name} vs ${target.away.name}`,
        homeTeam: target.home.name,
        awayTeam: target.away.name,
        homeProj,
        awayProj,
        value: Math.round(pHome * 100),
        pHome,
        pAway: 1 - pHome,
      },
    ];
  }

  return <WinProbabilityChartClient week={selectedWeek} items={items} />;
}
