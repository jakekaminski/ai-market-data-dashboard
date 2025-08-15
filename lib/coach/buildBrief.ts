import type {
  CoachBrief,
  Mismatch,
  StartSitAdvice,
  StreamerAdvice,
} from "@/types/coach";
import type { FantasyDataDTO, Team } from "@/types/fantasy";
import { riskAdjustedProjection } from "./scoring";

// minimal shape finders—adapt to your DTOs
function teamById(teams: Team[], id: number) {
  return teams.find((t) => t.id === id);
}

export function buildCoachBrief({
  dto,
  teams,
  week,
  teamId,
  risk,
  live,
  posRatings, // map like: { "WR": { defenseRankAgainst: number }, ... }
}: {
  dto: FantasyDataDTO;
  teams: Team[];
  week: number;
  teamId: number;
  risk: number;
  live: boolean;
  posRatings: Record<string, { defenseRankAgainst: number }>;
}): CoachBrief {
  const matchup = dto.matchups.find(
    (m) => m.home.teamId === teamId || m.away.teamId === teamId
  );
  if (!matchup) {
    return {
      week,
      teamName: "Unknown",
      opponentName: "Unknown",
      summaryBullets: ["No matchup found for this team/week."],
      startSit: [],
      streamers: [],
      mismatches: [],
      risk,
      live,
    };
  }

  const isHome = matchup.home.teamId === teamId;
  const you = isHome ? matchup.home : matchup.away;
  const opp = isHome ? matchup.away : matchup.home;

  // ----- START/SIT across your roster slots -----
  const startSit: StartSitAdvice[] = [];
  // (You’ll have your actual slot mapping; for demo we use every starter vs any bench in same position)
  // Replace with your real starters/bench partition:
  const starters = (
    isHome ? matchup.home.roster ?? [] : matchup.away.roster ?? []
  ).slice(0, 9); // tweak
  const bench = (
    isHome ? matchup.home.roster ?? [] : matchup.away.roster ?? []
  ).slice(9);

  for (const s of starters) {
    const pos = s.position;
    const rank = posRatings[pos]?.defenseRankAgainst;
    const currRiskAdj = riskAdjustedProjection(s.projectedPoints, rank, risk);
    let bestAlt: StartSitAdvice["alternative"] | undefined;
    let bestDelta = 0;

    for (const b of bench.filter((x) => x.position === pos)) {
      const altRank = posRatings[pos]?.defenseRankAgainst;
      const altRiskAdj = riskAdjustedProjection(
        b.projectedPoints,
        altRank,
        risk
      );
      const delta = altRiskAdj - currRiskAdj;
      if (delta > bestDelta) {
        bestDelta = delta;
        bestAlt = {
          name: b.name,
          proj: b.projectedPoints,
          riskAdjProj: altRiskAdj,
          reason: "Better risk-adjusted projection",
        };
      }
    }

    startSit.push({
      slot: pos,
      current: {
        name: s.name,
        proj: s.projectedPoints,
        riskAdjProj: currRiskAdj,
        injury: undefined,
      },
      alternative: bestAlt,
      delta: bestDelta,
    });
  }

  // ----- STREAMERS (very simple first pass) -----
  const streamers: StreamerAdvice[] = [];
  const streamPositions: Array<StreamerAdvice["position"]> = [
    "QB",
    "K",
    "D/ST",
  ];
  for (const pos of streamPositions) {
    const rank = posRatings[pos]?.defenseRankAgainst;
    if (rank && rank <= 8) {
      // tough matchup—recommend looking for a streamer (placeholder)
      streamers.push({
        position: pos,
        candidate: `Best available ${pos}`,
        reason: `Faces top-8 defense vs ${pos}`,
        expectedGain: 2.0, // placeholder until you wire free-agent search
      });
    }
  }

  // ----- POSITIONAL MISMATCH vs opponent -----
  const positions = Array.from(
    new Set([
      ...(isHome ? matchup.home.roster ?? [] : matchup.away.roster ?? []).map(
        (p) => p.position
      ),
    ])
  );
  const mismatches: Mismatch[] = positions
    .map((pos) => {
      const yourTop = (
        isHome ? matchup.home.roster ?? [] : matchup.away.roster ?? []
      )
        .filter((p) => p.position === pos)
        .sort((a, b) => b.projectedPoints - a.projectedPoints)
        .slice(0, 2)
        .reduce((sum, p) => sum + p.projectedPoints, 0);

      const oppTop = (
        isHome ? matchup.away.roster ?? [] : matchup.home.roster ?? []
      )
        .filter((p) => p.position === pos)
        .sort((a, b) => b.projectedPoints - a.projectedPoints)
        .slice(0, 2)
        .reduce((sum, p) => sum + p.projectedPoints, 0);

      return {
        position: pos,
        you: yourTop,
        opp: oppTop,
        delta: yourTop - oppTop,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  // ----- Summary bullets (deterministic) -----
  const bigDelta = startSit
    .filter((s) => s.alternative && s.delta > 0.5)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  const summaryBullets: string[] = [
    ...bigDelta.map(
      (s) =>
        `Start **${s.alternative!.name}** over **${s.current.name}** at ${
          s.slot
        } (+${s.delta.toFixed(1)} rAdj pts).`
    ),
    ...(mismatches[0]
      ? [
          `Exploit ${
            mismatches[0].position
          }: you +${mismatches[0].delta.toFixed(1)} vs opp.`,
        ]
      : []),
    ...(streamers[0]
      ? [
          `Consider a ${streamers[0].position} streamer — tough matchup for your starter.`,
        ]
      : []),
  ];

  const teamName =
    (isHome ? matchup.home.name : matchup.away.name) ?? "Unknown Team";
  const opponentName =
    (isHome ? matchup.away.name : matchup.home.name) ?? "Unknown Opponent";

  return {
    week,
    teamName,
    opponentName,
    summaryBullets,
    startSit,
    streamers,
    mismatches,
    risk,
    live,
  };
}
