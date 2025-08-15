export type PositionLabel = "QB" | "RB" | "WR" | "TE" | "K" | "D/ST";

export type StartSitAdvice = {
  slot: string; // e.g. "WR2"
  current: { name: string; proj: number; riskAdjProj: number; injury?: string };
  alternative?: {
    name: string;
    proj: number;
    riskAdjProj: number;
    reason: string;
  };
  delta: number; // alt.riskAdjProj - current.riskAdjProj
};

export type StreamerAdvice = {
  position: PositionLabel;
  candidate: string;
  reason: string; // e.g. "faces bottom-5 pass defense"
  expectedGain: number;
};

export type Mismatch = {
  position: string;
  you: number; // your projected at that position (top N)
  opp: number; // opponent projected at that position (top N)
  delta: number;
};

export type CoachBrief = {
  week: number;
  teamName: string;
  opponentName: string;
  summaryBullets: string[]; // ready-to-render bullets
  startSit: StartSitAdvice[];
  streamers: StreamerAdvice[];
  mismatches: Mismatch[];
  risk: number;
  live: boolean;
};

export type DvpTable = {
  // teamId -> pos -> avg points allowed per game
  [teamId: number]: Partial<Record<PositionLabel, number>>;
};

export type DvpRanks = {
  // teamId -> pos -> rank (1 = toughest, higher = softer)
  [teamId: number]: Partial<Record<PositionLabel, number>>;
};

export type CoachBriefLLM = {
  headline: string; // "You’ve got a path if you swap WR2"
  bullets: string[]; // 3–6 short actionable bullets
  risks?: string[]; // optional "watch outs"
  moves?: Array<{
    // optional concrete actions
    label: string; // "Start Puka over Ridley at WR2"
    reason?: string; // "adds ~2.1 rAdj pts"
  }>;
};
