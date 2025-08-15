import type { DvpRanks, DvpTable, PositionLabel } from "@/types/coach";
import type { FantasyDataDTO, PlayerCard } from "@/types/fantasy";

const POS_MAP: Record<string, PositionLabel | undefined> = {
  "1": "QB",
  "2": "RB",
  "3": "WR",
  "4": "TE",
  "5": "K",
  "16": "D/ST",
  QB: "QB",
  RB: "RB",
  WR: "WR",
  TE: "TE",
  K: "K",
  "D/ST": "D/ST",
};

function posLabel(pos: string): PositionLabel | undefined {
  return POS_MAP[String(pos)];
}

/** Choose "starters" when your roster cards don't carry lineupSlot.
 * Fallback: take the top-N projections per position (N approximates starter counts).
 */
function topNByPos(
  roster: PlayerCard[],
  nByPos: Record<PositionLabel, number>
): Record<PositionLabel, PlayerCard[]> {
  const buckets: Record<PositionLabel, PlayerCard[]> = {
    QB: [],
    RB: [],
    WR: [],
    TE: [],
    K: [],
    "D/ST": [],
  };
  for (const p of roster) {
    const label = posLabel(p.position);
    if (!label) continue;
    if (!Number.isFinite(Number(p.projectedPoints))) continue;
    buckets[label]!.push(p);
  }
  for (const key of Object.keys(buckets) as PositionLabel[]) {
    buckets[key] = buckets[key]
      .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
      .slice(0, nByPos[key] ?? 0);
  }
  return buckets;
}

/** Build projection-implied DvP for a single week from the weekly DTO */
export function buildImpliedDvpFromProjections(
  dto: FantasyDataDTO,
  selectedWeek: number
): DvpRanks {
  const table: DvpTable = {};

  // Starter counts per position typical for ESPN lineups; adjust for your league if needed.
  const STARTERS: Record<PositionLabel, number> = {
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    K: 1,
    "D/ST": 1,
  };

  const thisWeeks = dto.matchups.filter(
    (m) => (m.week ?? dto.week) === selectedWeek
  );

  const addAllowed = (defTeamId: number, pos: PositionLabel, pts: number) => {
    table[defTeamId] ||= {};
    table[defTeamId][pos] = (table[defTeamId][pos] || 0) + (Number(pts) || 0);
  };

  for (const m of thisWeeks) {
    // Your DTO stores player cards per side (homeRoster/awayRoster). If not, adapt to your shape.
    const homeStarters = topNByPos(m.home?.roster ?? [], STARTERS);
    const awayStarters = topNByPos(m.away?.roster ?? [], STARTERS);

    // Attribute HOME offense to AWAY defense
    for (const pos of Object.keys(STARTERS) as PositionLabel[]) {
      const projSum = (homeStarters[pos] || []).reduce(
        (s, p) => s + (Number(p.projectedPoints) || 0),
        0
      );
      addAllowed(m.away.teamId, pos, projSum);
    }
    // Attribute AWAY offense to HOME defense
    for (const pos of Object.keys(STARTERS) as PositionLabel[]) {
      const projSum = (awayStarters[pos] || []).reduce(
        (s, p) => s + (Number(p.projectedPoints) || 0),
        0
      );
      addAllowed(m.home.teamId, pos, projSum);
    }
  }

  // Convert to ranks per position (ascending: fewer expected points allowed = tougher = rank 1)
  const ranks: DvpRanks = {};
  const positions: PositionLabel[] = ["QB", "RB", "WR", "TE", "K", "D/ST"];

  for (const pos of positions) {
    const entries = Object.entries(table)
      .map(
        ([teamId, posMap]) =>
          [Number(teamId), posMap[pos] as number | undefined] as const
      )
      .filter(([, v]) => typeof v === "number" && Number.isFinite(v)) as Array<
      [number, number]
    >;

    entries.sort((a, b) => a[1] - b[1]);

    entries.forEach(([teamId], i) => {
      ranks[teamId] ||= {};
      ranks[teamId][pos] = i + 1;
    });
  }

  return ranks;
}
