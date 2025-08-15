"use client";
import { BrainCircuit, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { ModeToggle } from "../ui/mode-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function Filters({
  initialWeek,
  initialTeam,
  initialRisk,
  refreshAction,
}: {
  initialWeek: number;
  initialTeam: string;
  initialRisk: number;
  refreshAction?: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(sp);
    next.set(key, value);
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const week = useSearchParams().get("week");
  const teamId = useSearchParams().get("team");
  const risk = useSearchParams().get("risk");
  const showLiveOnly = useSearchParams().get("live");

  return (
    <div className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <BrainCircuit className="h-4 w-4" /> AI Fantasy Coach
            </Badge>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <div className="hidden text-sm text-muted-foreground md:block">
              Week {week} • Optimize roster, waivers & trades
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            <Select
              value={week ?? String(initialWeek || 1)}
              onValueChange={(v) => setParam("week", v)}
              defaultValue={String(initialWeek || 1)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Week" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 18 }).map((_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Week {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={teamId ?? initialTeam}
              defaultValue={initialTeam}
              onValueChange={(v) => setParam("team", v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {/* Replace with map(staticBundle.teams) */}
                <SelectItem value="my-team">My Team</SelectItem>
                <SelectItem value="opponent">Opponent</SelectItem>
                <SelectItem value="any">All Teams</SelectItem>
              </SelectContent>
            </Select>

            <Tooltip>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="risk"
                  className="whitespace-nowrap text-xs text-muted-foreground"
                >
                  Risk tolerance
                </Label>
                <div className="w-40">
                  <TooltipTrigger asChild>
                    <Slider
                      id="risk"
                      defaultValue={[initialRisk]}
                      onValueCommit={(v) =>
                        setParam("risk", String(v[0] ?? 50))
                      }
                    />
                  </TooltipTrigger>
                </div>
              </div>
              <TooltipContent>
                Higher risk favors boom/bust starts and upside waiver plays.
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-2 pl-2">
              <Switch
                id="live"
                onCheckedChange={(checked) =>
                  setParam("live", checked ? "true" : "false")
                }
                defaultChecked={!!showLiveOnly}
              />
              <Label htmlFor="live" className="text-xs">
                Live only
              </Label>
            </div>

            {refreshAction ? (
              <form action={refreshAction}>
                <Button
                  type="submit"
                  size="default"
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
              </form>
            ) : (
              <Button
                size="default"
                variant="outline"
                className="gap-2"
                disabled
                onClick={() => router.refresh()}
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            )}
            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
