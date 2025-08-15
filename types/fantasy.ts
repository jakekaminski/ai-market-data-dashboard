/** -----------------------------
 *  ESPN League (raw payload)
 *  -----------------------------
 */

export interface EspnLeague {
  id: number; // leagueId
  gameId: number; // 1 = NFL
  seasonId?: number; // e.g., 2025
  scoringPeriodId?: number; // current week
  draftDetail?: { drafted: boolean; inProgress: boolean };

  members: Member[];
  teams?: Team[]; // mTeam / mRoster
  schedule?: ScheduleEntry[]; // mMatchup / mMatchupScore / mBoxscore
  // Add other top-level views as you adopt them (settings, status, etc.)
}

export interface Member {
  id: string; // "{GUID}"
  displayName: string;
  firstName?: string;
  lastName?: string;
  notificationSettings?: NotificationSetting[];
}

export interface NotificationSetting {
  enabled: boolean;
  id: string;
  type:
    | "TEAM_PLAYER_INJURY"
    | "TEAM_PLAYER_AVAILABILITY"
    | "TEAM_PLAYER_NEWS"
    | "TEAM_PLAYER_STARTBENCH"
    | "TEAM_TRADE_OFFER"
    | "DRAFT"
    | "TEAM_MATCHUP_SCORE"
    | "KEY_PLAY"
    | "REDZONE"
    | "ADD_DROP"
    | "WEEKLY_RECAP"
    | "WAIVERS"
    | "CELEBRATION_SHARE"
    | string;
}

/** -----------------------------
 *  Teams & Records
 *  -----------------------------
 */

export interface Team {
  id: number; // fantasy team id
  abbrev?: string;
  location?: string;
  nickname?: string;
  name?: string; // sometimes provided; else derive `${location} ${nickname}`
  logo?: string;
  logoType?: string;

  divisionId?: number;
  primaryOwner?: string; // member id
  owners?: string[];

  // mTeam / mSettings
  record?: TeamRecord;
  pointsByStat?: Record<string, number>;
  transactionCounter?: {
    acquisitions?: number;
    drops?: number;
    moveToIR?: number;
    moveFromIR?: number;
    trades?: number;
  };

  // mRoster
  roster?: TeamRoster;
}

export interface TeamRoster {
  entries: RosterEntry[];
}

export interface TeamRecord {
  overall?: TeamRecordSplit;
  home?: TeamRecordSplit;
  away?: TeamRecordSplit;
  division?: TeamRecordSplit;
  pointsFor?: number;
  pointsAgainst?: number;
}

export interface TeamRecordSplit {
  wins: number;
  losses: number;
  ties: number;
  percentage?: number;
  pointsFor?: number;
  pointsAgainst?: number;
}

/** -----------------------------
 *  Schedule & Matchups
 *  -----------------------------
 */

export interface ScheduleEntry {
  id?: number; // internal matchup id
  matchupId?: number; // sometimes present
  matchupPeriodId?: number; // week index
  home: TeamSide;
  away: TeamSide;
  winner?: "HOME" | "AWAY" | "TIE" | "UNDECIDED";
}

export interface TeamSide {
  teamId: number;
  totalPoints?: number; // side total (actual)
  totalPointsLive?: number; // live scoring total
  totalProjectedPointsLive?: number; // live projection total
  cumulativeScore?: CumulativeScore;

  gamesPlayed?: number;
  rosterForCurrentScoringPeriod?: RosterForPeriod; // quick snapshot (live/week)
}

export interface CumulativeScore {
  wins: number;
  losses: number;
  ties: number;
  statBySlot: null | unknown;
  scoreByStat: ScoreByStatMap;
}

export type ScoreByStatMap = Record<
  string,
  {
    ineligible: boolean;
    rank: number;
    result: number | null;
    score: number;
  }
>;

/** -----------------------------
 *  Roster / Player cards
 *  -----------------------------
 */

export interface RosterForPeriod {
  appliedStatTotal: number; // fantasy points in this period
  entries: RosterEntry[];
}

export interface RosterEntry {
  acquisitionDate?: string | null;
  acquisitionType?: string | null;
  injuryStatus?: InjuryStatus; // "NORMAL" | "ACTIVE" | "QUESTIONABLE" | "OUT" | ...
  lineupSlotId: number; // e.g., 0=QB, 2=RB, 3/4=WR, 6=TE, 23=FLEX, 20=BN, etc.
  pendingTransactionIds?: number[] | null;
  playerId?: number;
  playerPoolEntry: PlayerPoolEntry;
  status?: InjuryStatus; // often "NORMAL"
}

export type InjuryStatus =
  | "NORMAL"
  | "ACTIVE"
  | "QUESTIONABLE"
  | "OUT"
  | string;

export interface PlayerPoolEntry {
  id?: number; // same as playerId
  appliedStatTotal?: number; // fantasy points (total for a stat context)
  keeperValue?: number;
  keeperValueFuture?: number;
  lineupLocked?: boolean;
  onTeamId?: number; // fantasy team id
  rosterLocked?: boolean;
  status?: "ONTEAM" | string;
  tradeLocked?: boolean;
  player: PlayerCardRaw;
}

export interface PlayerCardRaw {
  id: number;
  fullName: string; // "Ja'Marr Chase"
  firstName: string;
  lastName: string;

  defaultPositionId: number; // 0 QB, 2 RB, 3 WR, 4 TE, 5 K, 16 D/ST...
  proTeamAbbreviation?: string; // often present on some views
  proTeamId: number; // ESPN team id

  eligibleSlots: number[]; // where they can be placed

  active: boolean;
  injured: boolean;
  injuryStatus: "ACTIVE" | "QUESTIONABLE" | "OUT" | string;

  droppable: boolean;
  lastNewsDate?: number; // epoch ms
  universeId?: number;

  rankings?: Record<string, RankingItem[]>;
  stats: PlayerStatLine[];
}

export interface RankingItem {
  rank: number;
  rankType: "PPR" | "STANDARD" | string;
  rankSourceId: number;
  slotId: number;
  published: boolean;
  auctionValue: number;
  averageRank?: number;
}

export interface PlayerStatLine {
  id?: string; // e.g., "1120251"
  externalId?: string; // "20251" (season-week)
  seasonId: number; // 2025
  scoringPeriodId: number; // week number
  proTeamId: number;
  statSourceId: number; // commonly 0=actual, 1=proj
  statSplitTypeId: number; // 1=total etc.

  stats: Record<string, number>; // raw stats keyed by numeric id strings
  appliedStats: Record<string, number>;
  appliedTotal: number;
  variance?: Record<string, number>; // what's this for?
}

/** -----------------------------
 *  Bundled view return types
 *  -----------------------------
 */

export interface LeagueBase {
  id: number;
  gameId: number;
  seasonId: number;
  scoringPeriodId: number;
}

export interface LeagueSettingsView {
  settings?: unknown;
} // extend when needed
export interface TeamsView {
  teams: Team[];
}
export interface MatchupView {
  schedule: ScheduleEntry[];
}
export interface LiveScoringView {
  liveScoring?: unknown;
} // extend when needed
export interface TransactionsView {
  pendingTransactions?: unknown;
} // extend when needed
/** ESPN mPositionalRatings shape (from positionAgainstOpponent.positionalRatings) */
export interface PositionalRatingsView {
  positionAgainstOpponent?: {
    positionalRatings?: Record<string, PositionalRating>;
  };
}

export type NumericMap = Record<string, number>;

export interface MatchupScoreView {
  gameId: number;
  id: number; // leagueId
  draftDetail: {
    drafted: boolean;
    inProgress: boolean;
  };
  // Season + scoring period context
  scoringPeriodId: number;
  seasonId: number;
  segmentId: number;

  // Full season schedule (all matchup periods)
  schedule: MatchupScoreSchedule[];

  // League status meta
  status: {
    activatedDate: number;
    createdAsLeagueType: number;
    currentLeagueType: number;
    currentMatchupPeriod: number;
    finalScoringPeriod: number;
    firstScoringPeriod: number;
    isActive: boolean;
    isExpired: boolean;
    isFull: boolean;
    isPlayoffMatchupEdited: boolean;
    isToBeDeleted: boolean;
    isViewable: boolean;
    isWaiverOrderEdited: boolean;
    latestScoringPeriod: number;
    previousSeasons: number[];
    standingsUpdateDate: number;
    teamsJoined: number;
    transactionScoringPeriod: number;
    waiverLastExecutionDate: number;
    waiverProcessStatus: Record<string, unknown>;
  };
}

export interface MatchupScoreSchedule {
  id: number; // matchup id
  matchupPeriodId: number; // week
  playoffTierType?: "NONE" | "WINNERS" | "LOSERS" | string;
  winner: "HOME" | "AWAY" | "TIE" | "UNDECIDED";
  home: MatchupScoreSide;
  away: MatchupScoreSide;
}

export interface MatchupScoreSide {
  adjustment: number;
  teamId: number;
  tiebreak: number;
  totalPoints: number;
  totalPointsLive?: number;

  // Only present on some views/periods:
  cumulativeScore?: {
    wins: number;
    losses: number;
    ties: number;
    statBySlot: unknown | null;
  };

  // Map of scoringPeriodId -> total points in that period (e.g., { "1": 0 })
  pointsByScoringPeriod?: NumericMap;

  // Snapshot of active lineup for the current scoring period
  rosterForCurrentScoringPeriod?: RosterForPeriod;

  // Sometimes present but empty during the week
  rosterForMatchupPeriodDelayed?: {
    entries: RosterEntry[];
  };
}

/** Per-position ratings entry.
 * - average: league-wide average defensive rank vs this position (1..32; smaller = harder)
 * - ratingsByOpponent: map of opponent teamId -> defensive rank vs this position
 */
export interface PositionalRating {
  average: number; // may be 0 / missing early season
  ratingsByOpponent: Record<string, number>;
}

export type StaticBundle = LeagueBase & TeamsView & Partial<LeagueSettingsView>;
export type WeeklyBundle = LeagueBase & Partial<MatchupView>;
export type LiveBundle = LeagueBase & Partial<LiveScoringView>;
export type TxBundle = LeagueBase & Partial<TransactionsView>;
export type PositionalRatingsBundle = LeagueBase &
  Partial<PositionalRatingsView>;
export type SeasonBundle = LeagueBase & Partial<MatchupScoreView>;

/** -----------------------------
 *  UI-facing DTOs (cleaned shapes)
 *  -----------------------------
 */

// Position labels & lineup slot labels for UI
export const POSITION_LABEL: Record<
  number,
  "QB" | "RB" | "WR" | "TE" | "K" | "D/ST" | "FLEX" | "BN" | string
> = {
  0: "QB",
  1: "RB",
  2: "RB",
  3: "WR",
  4: "TE",
  5: "K",
  16: "D/ST",
  23: "FLEX",
};

export const LINEUP_SLOT_LABEL: Record<number, string> = {
  0: "QB",
  2: "RB",
  3: "WR",
  4: "WR",
  5: "K",
  6: "TE",
  7: "Bench",
  20: "IR",
  21: "IR",
  23: "FLEX",
  25: "RB/WR",
};

// UI Player card (trimmed/normalized for tables)
export interface PlayerCard {
  id: number;
  name: string;
  team: string; // e.g., "CIN"
  position: string; // e.g., "WR"
  projectedPoints: number;
  actualPoints: number;
  bench: boolean;
}

export interface MatchupDTO {
  week: number;
  matchupId?: number;
  home: {
    name: string;
    teamId: number;
    totalPoints: number;
    totalProjectedPoints: number;
    totalProjectedPointsLive?: number;
    roster?: PlayerCard[];
  };
  away: {
    name: string;
    teamId: number;
    totalPoints: number;
    totalProjectedPoints: number;
    totalProjectedPointsLive?: number;
    roster?: PlayerCard[];
  };
}

export interface FantasyDataDTO {
  seasonId?: number;
  week: number;
  matchups: MatchupDTO[];
  teams: Team[];
}

export interface TeamDTO {
  id: number;
  location: string;
  nickname: string;
  name: string;
  roster: {
    entries: RosterEntry[];
  };
  // Add other ESPN team fields as needed
}

export interface SeasonBundleDTO {
  seasonId: number;
  status: {
    latestScoringPeriod?: number;
    [key: string]: any;
  };
  schedule: Array<{
    id: number;
    matchupPeriodId?: number;
    home: {
      name: string;
      teamId: number;
      totalPoints: number;
      totalProjectedPoints: number;
    };
    away: {
      name: string;
      teamId: number;
      totalPoints: number;
      totalProjectedPoints: number;
    };
  }>;
  // Add other ESPN season fields here as needed
}
