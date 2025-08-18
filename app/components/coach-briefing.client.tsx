"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildCoachBrief } from "@/lib/coach/buildBrief";
import { cn } from "@/lib/utils";
import { CoachBriefLLM } from "@/types/coach";
import { RefreshCw, Sparkle } from "lucide-react";
import { useActionState } from "react";

export default function CoachBriefingClient({
  deterministicData: deterministic,
  refreshAction,
}: {
  deterministicData: ReturnType<typeof buildCoachBrief>;
  /** Server Action signature: (prev, formData) => Promise<{ ai: CoachBriefLLM | null; error: string | null }> */
  refreshAction: (
    prevState: { ai: CoachBriefLLM | null; error: string | null },
    formData: FormData
  ) => Promise<{ ai: CoachBriefLLM | null; error: string | null }>;
}) {
  // useActionState wires the Server Action return value into client state
  const [{ ai, error }, formAction, pending] = useActionState<
    { ai: CoachBriefLLM | null; error: string | null },
    FormData
  >(refreshAction, { ai: null, error: null });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkle className="h-4 w-4" /> AI Coach
        </CardTitle>
        <CardAction>
          <form action={formAction} className="inline-flex items-center">
            {/* Pass deterministic JSON to the Server Action via hidden input */}
            <input
              type="hidden"
              name="deterministic"
              value={JSON.stringify(deterministic)}
            />
            <Button
              type="submit"
              size="default"
              variant="outline"
              disabled={pending}
            >
              <RefreshCw
                className={cn("h-4 w-4", pending ? "animate-spin" : "")}
              />
            </Button>
          </form>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        {error ? (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-4">
            <h2 className="text-lg font-semibold text-destructive">{error}</h2>
          </div>
        ) : ai && (ai.headline || ai.bullets?.length) ? (
          <div className="rounded border bg-accent p-4">
            <h2 className="text-lg font-semibold">{ai.headline}</h2>
            {!!ai.bullets?.length && (
              <ul className="list-inside list-disc">
                {ai.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Press Refresh to generate the AI coach brief.
          </div>
        )}

        {!error && !!ai?.moves?.length && (
          <>
            <div className="mt-3 text-sm font-medium">Suggested Moves</div>
            <ul className="list-inside list-disc text-sm">
              {ai.moves.map((m, i) => (
                <li key={i}>
                  {m.label}
                  {m.reason ? ` — ${m.reason}` : ""}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* transparency toggle */}
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Show data used
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-2 text-xs">
            {JSON.stringify(deterministic, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
