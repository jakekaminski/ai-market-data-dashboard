import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TEAM_ID } from "@/lib/espn/fetchers";
import {
  Activity,
  AlarmClockCheck,
  BarChart3,
  CalendarDays,
  ChartPie,
  ChevronRight,
  LineChart,
  ListChecks,
  Scale,
  ShieldAlert,
  Shuffle,
  Table2,
  TrendingUp,
  Users,
} from "lucide-react";
import { revalidateTag } from "next/cache";
import { SearchParams } from "next/dist/server/request/search-params";
import Filters from "../../components/dashboard/fliters.client";
import CoachBriefing from "./coach-briefing";
import WinProbabilityChart from "./win-probability-chart";

export async function refreshDashboard() {
  "use server";
  revalidateTag("dashboard");
}

export default async function FantasyDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const week = Number(params?.week) || 1;
  const teamId = Number(params?.team) || TEAM_ID;
  const risk = Number(params?.risk) || 50;
  const live = params?.live === "true";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Top Bar / Controls */}
        <Filters
          initialWeek={1}
          initialTeam="my-team"
          initialRisk={50}
          refreshAction={refreshDashboard}
        />
        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* LEFT COLUMN */}
            <div className="space-y-6 lg:col-span-2">
              {/* Win Probability Grid */}
              <Section
                title="Win Probability"
                icon={<ChartPie className="h-4 w-4" />}
              >
                <WinProbabilityChart
                  week={week}
                  teamId={teamId}
                  risk={risk}
                  live={live}
                />
              </Section>

              {/* Matchup Table */}
              <Section title="Matchups" icon={<Table2 className="h-4 w-4" />}>
                {/* Replace with your real component */}
                <Placeholder
                  height="h-64"
                  label="<MatchupTable data={fantasyData} />"
                />
              </Section>

              {/* Scoring Timeline */}
              <Section
                title="Scoring Timeline"
                icon={<LineChart className="h-4 w-4" />}
              >
                <Placeholder
                  height="h-56"
                  label="Area/Line chart of points over time (mLiveScoring)"
                />
              </Section>

              {/* Standings / Power Ranking */}
              <Section
                title="Standings & Power Rank"
                icon={<BarChart3 className="h-4 w-4" />}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Placeholder label="Sortable Standings Table" />
                  <Placeholder label="Power Ranking Trend (spark line per team)" />
                </div>
              </Section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* AI Coach Summary */}
              <CoachBriefing
                week={week}
                teamId={teamId}
                risk={risk}
                live={live}
              />

              {/* Start/Sit Optimizer */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ListChecks className="h-4 w-4" /> Start/Sit Optimizer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <Input placeholder="e.g., Swap WR3? Add bench RB?" />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shuffle className="h-4 w-4" /> AI recommends:{" "}
                      <span className="font-medium text-foreground">
                        WR X → FLEX, RB Y → Bench
                      </span>
                    </div>
                    <Button size="sm" className="self-start">
                      Optimize Lineup
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Waiver Wire */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" /> Waiver Wire Targets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-56">
                    <div className="space-y-3 text-sm">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border p-2"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">Player {i} · WR</span>
                            <span className="text-xs text-muted-foreground">
                              Next week: 12.4 proj · ROS: 8.1 avg
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Fit +72%</Badge>
                            <Button size="sm" variant="secondary">
                              Claim
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Trade Analyzer */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Scale className="h-4 w-4" /> Trade Analyzer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="You give (comma-separated)" />
                    <Input placeholder="You get (comma-separated)" />
                  </div>
                  <Button size="sm">Evaluate Trade</Button>
                  <div className="text-xs text-muted-foreground">
                    AI will summarize short-term gain, playoff impact, and
                    positional depth.
                  </div>
                </CardContent>
              </Card>

              {/* Injuries & News */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldAlert className="h-4 w-4" /> Key Injuries & News
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <AlarmClockCheck className="mt-0.5 h-4 w-4" />
                      <span>
                        <b>RB Z</b> (ankle) DNP Thu — downgrade if limited Fri.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlarmClockCheck className="mt-0.5 h-4 w-4" />
                      <span>
                        <b>WR Y</b> (hamstring) limited — boom/bust if active.
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Bye Week Planner */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="h-4 w-4" /> Bye Week Planner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" /> Upcoming gaps: RB (Wk 7),
                    WR (Wk 9)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Placeholder label="Mini calendar heatmap" />
                    <Placeholder label="Position coverage chips" />
                    <Placeholder label="AI suggestions" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Tabs: Advanced Analytics */}
          <div className="mt-8">
            <Tabs defaultValue="history">
              <TabsList>
                <TabsTrigger value="history" className="gap-2">
                  <LineChart className="h-4 w-4" /> History
                </TabsTrigger>
                <TabsTrigger value="projections" className="gap-2">
                  <TrendingUp className="h-4 w-4" /> Projections
                </TabsTrigger>
                <TabsTrigger value="sim" className="gap-2">
                  <BarChart3 className="h-4 w-4" /> Playoff Sims
                </TabsTrigger>
              </TabsList>
              <TabsContent value="history" className="space-y-4 pt-4">
                <Placeholder
                  height="h-64"
                  label="Weekly scores line chart per team"
                />
                <Placeholder height="h-48" label="Head-to-head heatmap" />
              </TabsContent>
              <TabsContent value="projections" className="space-y-4 pt-4">
                <Placeholder
                  height="h-48"
                  label="Rest-of-season projections by team/position"
                />
                <Placeholder
                  height="h-48"
                  label="Boom/Bust variance by player"
                />
              </TabsContent>
              <TabsContent value="sim" className="space-y-4 pt-4">
                <Placeholder height="h-56" label="Monte Carlo playoff odds" />
                <Placeholder height="h-48" label="Likely seeding bar chart" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* --------------------------- */
/* Small helpers / placeholders */
/* --------------------------- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Placeholder({ label, height }: { label: string; height?: string }) {
  return (
    <div
      className={`flex w-full items-center justify-between rounded-xl border bg-muted/30 px-4 ${
        height ?? "h-32"
      }`}
    >
      <div className="py-4 text-sm text-muted-foreground">{label}</div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}
