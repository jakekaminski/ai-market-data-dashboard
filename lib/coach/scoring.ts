export function mapOpponentRankToMultiplier(rank?: number) {
  if (!rank || rank < 1 || rank > 32) return 1;
  // linear 0.9 .. 1.10 (1 = hardest -> 0.90, 32 = softest -> 1.10)
  return 0.9 + ((rank - 1) / 31) * 0.2;
}

export function lerp(a: number, b: number, t: number) {
  const tt = Math.max(0, Math.min(1, t));
  return a + (b - a) * tt;
}

export function riskAdjustedProjection(
  baseProj: number,
  oppRank: number | undefined,
  risk: number,
  varianceGuess = 0.0
) {
  const matchupMult = mapOpponentRankToMultiplier(oppRank);
  const riskTilt = lerp(0.85, 1.15, risk / 100);
  // If you later compute real per-player variance, blend here:
  const varianceMult = 1 + varianceGuess * (risk / 100 - 0.5) * 0.2; // tiny tilt
  return (baseProj || 0) * matchupMult * riskTilt * varianceMult;
}
