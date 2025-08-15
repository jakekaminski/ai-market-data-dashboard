export const positionMap: Record<number, string> = {
  1: "QB",
  2: "RB",
  3: "WR",
  4: "TE",
  5: "K",
  16: "D/ST",
};

export function getPositionLabel(id: number) {
  return positionMap[id] || "??";
}
