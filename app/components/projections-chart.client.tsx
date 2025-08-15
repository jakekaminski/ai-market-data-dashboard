"use client";

import { ChartContainer } from "@/components/ui/chart";
import * as React from "react";

type Props = {
  /** rows like: { week: 1, "Team A": 112.3, "Team B": 101.4, ... } */
  data: Array<Record<string, number | string>>;
  /** team display names; must match keys in `data` */
  teams: string[];
  /** px height */
  height?: number;
  /** color mapping mode: "value" (points) or "rank" (1=best); default "value" */
  mode?: "value" | "rank";
};

export default function ProjectionsChartClient({
  data,
  teams,
  height = 360,
  mode = "value",
}: Props) {
  // Derive list of weeks from data
  const weeks = React.useMemo(
    () =>
      Array.from(new Set(data.map((d) => Number(d.week)))).sort(
        (a, b) => a - b
      ),
    [data]
  );

  // Flatten to cells: { team, week, value }
  const cells = React.useMemo(() => {
    const rows: { team: string; week: number; value: number }[] = [];
    for (const row of data) {
      const w = Number(row.week);
      for (const team of teams) {
        const v = Number(row[team]);
        if (Number.isFinite(v)) rows.push({ team, week: w, value: v });
      }
    }
    return rows;
  }, [data, teams]);

  // If ranking mode, transform values within each week to ranks (1 = highest value)
  const values = React.useMemo(() => {
    if (mode === "rank") {
      const byWeek = new Map<number, { team: string; value: number }[]>();
      for (const c of cells) {
        if (!byWeek.has(c.week)) byWeek.set(c.week, []);
        byWeek.get(c.week)!.push({ team: c.team, value: c.value });
      }
      const ranked: { team: string; week: number; value: number }[] = [];
      for (const w of weeks) {
        const list = (byWeek.get(w) || [])
          .slice()
          .sort((a, b) => b.value - a.value);
        list.forEach((entry, i) =>
          ranked.push({ team: entry.team, week: w, value: i + 1 })
        );
      }
      return ranked;
    }
    return cells;
  }, [cells, weeks, mode]);

  // Domain for color scale (min/max across the chosen mode)
  const [minV, maxV] = React.useMemo(() => {
    if (values.length === 0) return [0, 1] as const;
    let min = Infinity,
      max = -Infinity;
    for (const c of values) {
      if (c.value < min) min = c.value;
      if (c.value > max) max = c.value;
    }
    return [min, max] as const;
  }, [values]);

  // ---- Strict three-stop gradient mapping (sRGB, matches CSS gradient) ----
  // CSS reference: linear-gradient(90deg, hsl(220 90% 55%) 0%, hsl(35 95% 58%) 50%, hsl(15 90% 55%) 100%)
  // We mix in sRGB A→B (0..0.5) and B→C (0.5..1) to avoid unintended greens from HSL hue wrapping.

  function hslToRgb(
    h: number,
    sPct: number,
    lPct: number
  ): [number, number, number] {
    // h in [0..360), sPct/lPct in [0..100]
    const hNorm = ((h % 360) + 360) % 360;
    const s = Math.max(0, Math.min(1, sPct / 100));
    const l = Math.max(0, Math.min(1, lPct / 100));
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
    const m = l - c / 2;
    let r1 = 0,
      g1 = 0,
      b1 = 0;
    if (hNorm < 60) [r1, g1, b1] = [c, x, 0];
    else if (hNorm < 120) [r1, g1, b1] = [x, c, 0];
    else if (hNorm < 180) [r1, g1, b1] = [0, c, x];
    else if (hNorm < 240) [r1, g1, b1] = [0, x, c];
    else if (hNorm < 300) [r1, g1, b1] = [x, 0, c];
    else [r1, g1, b1] = [c, 0, x];
    const r = (r1 + m) * 255;
    const g = (g1 + m) * 255;
    const b = (b1 + m) * 255;
    return [r, g, b];
  }

  const RGB_A: [number, number, number] = hslToRgb(220, 90, 55); // blue
  const RGB_B: [number, number, number] = hslToRgb(35, 95, 58); // amber
  const RGB_C: [number, number, number] = hslToRgb(15, 90, 55); // red

  const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
  const lerp3 = (
    a: [number, number, number],
    b: [number, number, number],
    p: number
  ): [number, number, number] => [
    lerp(a[0], b[0], p),
    lerp(a[1], b[1], p),
    lerp(a[2], b[2], p),
  ];
  const toRgbString = ([r, g, b]: [number, number, number]) =>
    `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;

  function colorFor(v: number) {
    if (!Number.isFinite(v) || maxV === minV)
      return "hsl(var(--muted-foreground))";
    const t = (v - minV) / (maxV - minV); // 0..1
    if (t <= 0.5) {
      const p = t / 0.5; // A→B
      return toRgbString(lerp3(RGB_A, RGB_B, p));
    } else {
      const p = (t - 0.5) / 0.5; // B→C
      return toRgbString(lerp3(RGB_B, RGB_C, p));
    }
  }

  // Layout constants
  const labelColWidth = 112; // ~ w-28
  const headerHeight = 28;
  const legendHeight = 28;
  const availableRows = Math.max(teams.length, 1);
  const rowHeight = Math.max(
    22,
    Math.floor(
      (height -
        headerHeight -
        legendHeight -
        16 /*padding*/ -
        8) /*grid gaps*/ /
        availableRows
    )
  );

  return (
    <ChartContainer
      // ChartContainer config not used for heatmap colors, but keeps padding/border consistent
      config={{}}
      className="w-full rounded-md border p-2"
      style={{ height }}
    >
      <div className="flex h-full w-full flex-col">
        {/* Header row: [label gap] + week labels spanning columns */}
        <div
          className="grid items-center gap-1 px-2 pb-2"
          style={{
            gridTemplateColumns: `${labelColWidth}px repeat(${weeks.length}, 1fr)`,
          }}
        >
          <div
            className="text-xs font-medium text-muted-foreground"
            style={{ height: headerHeight }}
          >
            Team
          </div>
          {weeks.map((w) => (
            <div
              key={w}
              className="text-center text-xs font-medium text-muted-foreground"
              style={{ height: headerHeight }}
            >
              W{w}
            </div>
          ))}
        </div>

        {/* Body rows: each is a two-part grid [label | cells...] */}
        <div className="flex-1 overflow-auto">
          <div
            className="grid gap-2"
            style={{
              gridTemplateRows: `repeat(${teams.length}, ${rowHeight}px)`,
            }}
          >
            {teams.map((team) => (
              <div
                key={team}
                className="grid items-stretch"
                style={{ gridTemplateColumns: `${labelColWidth}px 1fr` }}
              >
                {/* Team label at left */}
                <div className="flex items-center px-2 text-xs">{team}</div>
                {/* Week cells fill remaining width equally */}
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
                  }}
                >
                  {weeks.map((w) => {
                    const c = values.find(
                      (x) => x.team === team && x.week === w
                    );
                    const val = c?.value;
                    const fill = colorFor(val ?? NaN);
                    return (
                      <div
                        key={`${team}-${w}`}
                        className="flex items-center justify-center rounded-sm border"
                        style={{ backgroundColor: fill }}
                        title={`${team} — W${w}: ${
                          mode === "rank"
                            ? `Rank ${val}`
                            : `${val?.toFixed?.(1) ?? "–"} pts`
                        }`}
                      >
                        <span className="text-[10px] font-medium text-background/90">
                          {mode === "rank"
                            ? val ?? "–"
                            : Number.isFinite(val)
                            ? (val as number).toFixed(0)
                            : "–"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div
          className="mt-2 flex items-center gap-2 px-2 text-xs text-muted-foreground"
          style={{ height: legendHeight }}
        >
          <span>{mode === "rank" ? "Tough" : "Lower"}</span>
          <div
            className="h-2 flex-1 rounded-sm"
            style={{
              background:
                "linear-gradient(90deg, hsl(220 90% 55%) 0%, hsl(35 95% 58%) 50%, hsl(15 90% 55%) 100%)",
            }}
          />
          <span>{mode === "rank" ? "Soft" : "Higher"}</span>
        </div>
      </div>
    </ChartContainer>
  );
}
