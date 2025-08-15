import type { FantasyDataDTO, MatchupDTO, PlayerCard } from "@/types/fantasy";
import type { DvpTable, DvpRanks, PositionLabel } from "@/types/coach";

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
          [Number(teamId), (posMap as any)[pos] as number | undefined] as const
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

// /**
//  * Build Defense-vs-Position table from your league's own history.
//  * Uses all matchups with week < selectedWeek.
//  */
// export function buildDvpTable(
//   dto: FantasyDataDTO,
//   selectedWeek: number
// ): DvpTable {
//   const table: DvpTable = {};
//   const gamesCount: Record<number, number> = {}; // games per NFL team seen

//   const past = dto.matchups.filter((m) => (m.week ?? dto.week) < selectedWeek);

//   const add = (defTeamId: number, pos: PositionLabel, points: number) => {
//     table[defTeamId] ||= {};
//     table[defTeamId][pos] = (table[defTeamId][pos] || 0) + points;
//   };

//   for (const m of past) {
//     // Attribute home offensive points to AWAY defense; and vice versa.
//     sumRosterIntoDefense(m.home.roster ?? [], m.away.teamId);
//     sumRosterIntoDefense(m.away.roster ?? [], m.home.teamId);

//     // Count one game for each defense encountered (to avg later)
//     gamesCount[m.home.teamId] = (gamesCount[m.home.teamId] || 0) + 1;
//     gamesCount[m.away.teamId] = (gamesCount[m.away.teamId] || 0) + 1;
//   }

//   // average per game
//   for (const [teamIdStr, posMap] of Object.entries(table)) {
//     const teamId = Number(teamIdStr);
//     const games = Math.max(1, gamesCount[teamId] || 1);
//     for (const p of Object.keys(posMap) as PositionLabel[]) {
//       posMap[p] = (posMap[p] as number) / games;
//     }
//   }

//   return table;

//   function sumRosterIntoDefense(roster: PlayerCard[], defTeamId: number) {
//     for (const p of roster) {
//       const pos = label(String(p.position));
//       if (!pos) continue;
//       const pts = Number(p.actualPoints) || 0;
//       if (pts <= 0) continue; // skip byes/inactive
//       add(defTeamId, pos, pts);
//     }
//   }
// }

// /** Convert DvP average table to 1..32 ranks per position (1 = fewest allowed = toughest) */
// export function rankDvp(table: DvpTable): DvpRanks {
//   const ranks: DvpRanks = {};
//   const positions: PositionLabel[] = ["QB", "RB", "WR", "TE", "K", "D/ST"];

//   for (const pos of positions) {
//     // collect [teamId, value] for this pos
//     const entries = Object.entries(table)
//       .map(
//         ([teamId, posMap]) =>
//           [Number(teamId), (posMap as any)[pos] as number | undefined] as const
//       )
//       .filter(([, v]) => typeof v === "number" && Number.isFinite(v)) as Array<
//       [number, number]
//     >;

//     // sort ascending (fewest allowed = toughest = rank 1)
//     entries.sort((a, b) => a[1] - b[1]);

//     // assign ranks
//     entries.forEach(([teamId], i) => {
//       ranks[teamId] ||= {};
//       ranks[teamId][pos] = i + 1;
//     });
//   }

//   return ranks;
// }
