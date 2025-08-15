"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartConfig, ChartContainer } from "../ui/chart";

export type ChartItem = {
  key: string;
  homeTeam: string;
  awayTeam: string;
  homeProj: number; // projected total for home
  awayProj: number; // projected total for away
  value: number; // percentage (0–100) for home win (unused in this battery)
  pHome: number; // 0..1 (unused here)
  pAway: number; // 0..1 (unused here)
};

const chartConfig = {
  home: {
    label: "Home",
    color: "var(--chart-1)",
  },
  away: {
    label: "Away",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const toNum = (v: unknown, fallback = 0): number =>
  Number.isFinite(Number(v)) ? Number(v) : fallback;

/**
 * Full-width horizontal "battery" bar showing projected totals:
 * - First segment = home projection
 * - Second segment = away projection
 * Uses a single data row stacked horizontally.
 */
export default function WinProbabilityChartClient({
  week,
  items,
}: {
  week: number;
  items: ChartItem[];
}) {
  const item = items?.[0];
  if (!item) return null;

  const home = Math.round(item.pHome * 100);
  const away = 100 - home;
  const total = 100;

  const data = [
    {
      name: `${item.homeTeam} vs ${item.awayTeam}`,
      home,
      away,
      total,
    },
  ];

  return (
    <ResponsiveContainer>
      <div className="w-full">
        <div className="mb-2 text-sm text-muted-foreground">
          Week {week} • {item.homeTeam} vs {item.awayTeam}
        </div>

        <ChartContainer config={chartConfig} className="h-24 w-full">
          <BarChart
            layout="vertical"
            accessibilityLayer
            data={data}
            barCategoryGap={0}
            margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
          >
            <CartesianGrid vertical={false} horizontal={false} />
            <XAxis type="number" dataKey="total" hide />
            <YAxis type="category" dataKey="name" hide />

            {/* Left segment (home) with rounded left end */}
            <Bar
              dataKey="home"
              stackId="proj"
              fill="var(--color-home)"
              radius={[6, 0, 0, 6]}
            >
              <LabelList
                dataKey="home"
                className="text-left text-lg fill-foreground"
                formatter={(value: any) => `${value}%`}
              />
            </Bar>
            {/* Right segment (away) with rounded right end */}
            <Bar
              dataKey="away"
              stackId="proj"
              fill="var(--color-away)"
              radius={[0, 6, 6, 0]}
            >
              <LabelList
                dataKey="away"
                className="text-left text-lg fill-foreground"
                formatter={(value: any) => `${value}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>

        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>
            {item.homeTeam}: {toNum(item.homeProj).toFixed(1)} pts
          </span>
          <span>
            {item.awayTeam}: {toNum(item.awayProj).toFixed(1)} pts
          </span>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
