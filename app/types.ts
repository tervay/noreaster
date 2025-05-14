export interface SheetAlliance {
  index: string;
  name: string;
  teams: string[];
}

export interface SheetAllianceInfo {
  alliances: SheetAlliance[];
}

interface SheetMatchAllianceAppearance {
  allianceIndex: string;
  alliancePlayed: string[];
  score: string;
  autoPoints: string;
  bargePoints: string;
  coralPoints: string;
  autoRP: boolean;
  bargeRP: boolean;
  coralRP: boolean;
}

export interface SheetMatch {
  matchNumber: string;
  time: string;
  redAlliance: SheetMatchAllianceAppearance;
  blueAlliance: SheetMatchAllianceAppearance;
  coop: boolean;
}

export interface SheetMatchInfo {
  matches: SheetMatch[];
}
