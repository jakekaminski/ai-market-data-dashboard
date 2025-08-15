import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FantasyDataDTO } from "@/types/fantasy";

export default async function MatchupTable({ data }: { data: FantasyDataDTO }) {
  const { week, matchups } = data;

  return (
    <div className="grid gap-6 p-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Week {week} Matchups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Home</TableHead>
                <TableHead>Away</TableHead>
                <TableHead>Home Score</TableHead>
                <TableHead>Away Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchups.map((m, idx) => (
                <TableRow key={idx}>
                  <TableCell>{m.homeTeam}</TableCell>
                  <TableCell>{m.awayTeam}</TableCell>
                  <TableCell>{m.homeScore.toFixed(1)}</TableCell>
                  <TableCell>{m.awayScore.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
