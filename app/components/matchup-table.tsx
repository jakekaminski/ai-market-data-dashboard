// app/components/matchup-table.tsx
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStaticBundle, getWeeklyBundle } from "@/lib/espn/fetchers";
import { transformWeeklyToFantasyDTO } from "@/lib/espn/helpers";
import { PlayerCard } from "@/types/fantasy";

type Props = {
  week: number;
};

/**
 * Server component that lists all matchups for the given week.
 * Columns:
 * - Home team
 * - Away team
 * - Projected (home vs away)
 * - Likely winner (badge)
 * - Played (count of players with actualPoints > 0) / Not played yet
 */
export default async function MatchupTable({ week }: Props) {
  const [weekly, statics] = await Promise.all([
    getWeeklyBundle(),
    getStaticBundle(),
  ]);
  const dto = transformWeeklyToFantasyDTO(weekly, statics?.teams ?? []);

  const selectedWeek = week || dto.week;

  const matchups = (dto.matchups || []).filter(
    (m) => (m.week ?? dto.week) === selectedWeek
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30%]">Home</TableHead>
          <TableHead className="w-[30%]">Away</TableHead>
          <TableHead className="w-[20%] text-right">Projected</TableHead>
          <TableHead className="w-[20%] text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matchups.map((m) => {
          const homeName = m.home.name;
          const awayName = m.away.name;

          const homeProj =
            m.home?.totalProjectedPoints ??
            m.home?.totalProjectedPointsLive ??
            sumProjected(m.home?.roster ?? []);
          const awayProj =
            m.away?.totalProjectedPoints ??
            m.away?.totalProjectedPointsLive ??
            sumProjected(m.away?.roster ?? []);

          const winner =
            (Number(homeProj) || 0) > (Number(awayProj) || 0)
              ? ("HOME" as const)
              : (Number(homeProj) || 0) < (Number(awayProj) || 0)
              ? ("AWAY" as const)
              : ("TIE" as const);

          const homePlayed = countPlayed(m.home?.roster ?? []);
          const awayPlayed = countPlayed(m.away?.roster ?? []);
          const homeTotal = (m.home?.roster ?? []).length || 0;
          const awayTotal = (m.away?.roster ?? []).length || 0;

          return (
            <TableRow
              key={`${selectedWeek}-${
                m.matchupId ?? `${m.home.teamId}-${m.away.teamId}`
              }`}
            >
              <TableCell className="align-middle">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-medium">{homeName}</div>
                  {winner === "HOME" && (
                    <Badge className="shrink-0">Likely Win</Badge>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {homePlayed}/{homeTotal} players have played
                </div>
              </TableCell>
              <TableCell className="align-middle">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-medium">{awayName}</div>
                  {winner === "AWAY" && (
                    <Badge className="shrink-0">Likely Win</Badge>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {awayPlayed}/{awayTotal} players have played
                </div>
              </TableCell>
              <TableCell className="align-middle text-right">
                <div className="font-medium">
                  {fmt(homeProj)}{" "}
                  <span className="text-muted-foreground">vs</span>{" "}
                  {fmt(awayProj)}
                </div>
              </TableCell>
              <TableCell className="align-middle text-right">
                {winner === "TIE" ? (
                  <Badge variant="outline">Even</Badge>
                ) : winner === "HOME" ? (
                  <Badge variant="secondary">Home Favored</Badge>
                ) : (
                  <Badge variant="secondary">Away Favored</Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/* ----------------- helpers ----------------- */

function sumProjected(roster: PlayerCard[]): number {
  if (!Array.isArray(roster)) return 0;
  return roster.reduce((sum, p) => {
    const v = Number(p.projectedPoints);
    return sum + (Number.isFinite(v) ? Number(v) : 0);
  }, 0);
}

function countPlayed(roster: PlayerCard[]): number {
  if (!Array.isArray(roster)) return 0;
  return roster.reduce((acc, p) => {
    const actual = Number(p.actualPoints);
    return acc + (Number(actual) > 0 ? 1 : 0);
  }, 0);
}

function fmt(n: unknown): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0.0";
  return v.toFixed(1);
}
