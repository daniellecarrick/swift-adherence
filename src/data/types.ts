export type Region = 'North America' | 'Latin America' | 'EMEA' | 'APAC';
export type Tier = 'team' | 'org' | 'enterprise';
export type WindowKey = '1M' | '3M' | '6M' | '1Y';
export type CreditType = 'badge' | 'pto' | 'holiday' | 'leave' | 'travel';
export type Feed = 'PTO' | 'Leave' | 'Travel';

export interface Office {
  id: string;
  city: string;
  country: string;
  region: Region;
  isHQ?: boolean;
}

/** One person's record for one Monday-to-Sunday week. */
export interface PersonWeek {
  days: Partial<Record<CreditType, number>>;
  credit: number; // total credit days, capped at 5
  adherent: boolean; // credit >= 3
  counted: boolean; // false for weeks with < 3 employed workdays
  missing: Feed[]; // feeds that were down and could have added credit
}

export interface Person {
  id: string;
  name: string;
  officeId: string;
  teamId: string;
  weeks: PersonWeek[];
}

export interface Team {
  id: string;
  managerName: string;
  officeLabel: string; // primary office, or "São Paulo, Bogotá"
  members: Person[];
}

export interface Persona {
  id: string;
  name: string;
  initials: string;
  title: string;
  tier: Tier;
  teams: Team[]; // a team-tier persona has exactly one team: their own
}
