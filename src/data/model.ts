import { LAST } from './generate';
import { OFFICE_BY_ID } from './offices';
import {
  buckets, cityOfPerson, groupCell, pct, personCell, rangeLabel, regionOfPerson, tally, trend, windowRange,
  type Cell, type Range, type Trend,
} from './adherence';
import type { Feed, Person, Persona, Region, Team, WindowKey } from './types';

const first = (name: string) => name.split(' ')[0];
const ordinal = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
const lastWeek: Range = { from: LAST, to: LAST };

export interface PersonRow {
  kind: 'person';
  id: string;
  name: string;
  office: string;
  region: Region;
  cells: Cell[];
  pct: number | null;
  trend: Trend;
  note: string;
}
export interface TeamRow {
  kind: 'team';
  id: string;
  name: string; // manager name
  size: number;
  office: string;
  region: Region | 'Multiple';
  cells: Cell[];
  pct: number | null;
  change: number | null;
  trend: Trend;
  pendingPeople: number;
  /** Computed on demand, so large orgs only pay for the teams someone expands. */
  members: () => PersonRow[];
}

export interface Notice { feeds: Feed[]; people: number; text: string }

function personRow(p: Person, r: Range): PersonRow {
  const w = p.weeks[LAST];
  const badge = w.days.badge ?? 0;
  let note = `${w.credit} credit day${w.credit === 1 ? '' : 's'} last week`;
  if (!w.counted) note = 'New hire, not counted yet';
  else if (w.missing.length) note = `${w.missing.join(', ')} data missing last week`;
  else if (badge === w.credit) note = `${badge} day${badge === 1 ? '' : 's'} in office last week`;
  return {
    kind: 'person', id: p.id, name: p.name, office: cityOfPerson(p), region: regionOfPerson(p),
    cells: buckets(r).map((b) => personCell(p, b)), pct: pct(tally([p], r)), trend: trend([p], r, true), note,
  };
}

const byPct = <T extends { pct: number | null; name: string }>(a: T, b: T) =>
  (a.pct ?? 101) - (b.pct ?? 101) || a.name.localeCompare(b.name);

function teamRow(t: Team, r: Range, prev: Range): TeamRow {
  const regions = new Set(t.members.map(regionOfPerson));
  const now = pct(tally(t.members, r));
  const before = pct(tally(t.members, prev));
  return {
    kind: 'team', id: t.id, name: t.managerName, size: t.members.length, office: t.officeLabel,
    region: regions.size === 1 ? [...regions][0] : 'Multiple',
    cells: buckets(r).map((b) => groupCell(t.members, b)), pct: now,
    change: now !== null && before !== null ? now - before : null,
    trend: trend(t.members, r, false),
    pendingPeople: t.members.filter((p) => p.weeks.slice(r.from, r.to + 1).some((w) => w.missing.length)).length,
    members: () => t.members.map((p) => personRow(p, r)).sort(byPct),
  };
}

function notice(people: Person[], r: Range): Notice | null {
  const t = tally(people, r);
  if (!t.incomplete) return null;
  const affected = people.filter((p) => p.weeks.slice(r.from, r.to + 1).some((w) => w.missing.length));
  const feeds = [...t.missing];
  const when = rangeLabel(lastWeek);
  const n = affected.length;
  const who = n === 1 ? `${affected[0].name.split(' ')[0]}'s` : `${n} people's`;
  return { feeds, people: n, text: `${feeds.join(' and ')} data for ${when} hasn't arrived for ${who} records. Striped weeks may change when it does.` };
}

// ---------------------------------------------------------------------------

export interface Summary { pct: number | null; change: number | null; adherent: number; counted: number; people: number }

function summary(people: Person[], r: Range, prev: Range): Summary {
  const t = tally(people, r);
  const p = pct(t);
  const b = pct(tally(people, prev));
  return { pct: p, change: p !== null && b !== null ? p - b : null, adherent: t.adherent, counted: t.counted, people: people.length };
}

export interface TeamHome {
  tier: 'team';
  eyebrow: string;
  headline: string;
  sub: string;
  summary: Summary;
  rows: PersonRow[];
  notice: Notice | null;
}

export interface OfficeStat { city: string; region: Region; pct: number | null; size: number; pending: boolean }
export interface RegionStat { region: Region; pct: number | null; size: number; cells: Cell[]; trend: Trend; offices: OfficeStat[] }

export interface OrgHome {
  tier: 'org' | 'enterprise';
  eyebrow: string;
  headline: string;
  sub: string;
  summary: Summary;
  teams: TeamRow[];
  offices: OfficeStat[];
  regions: RegionStat[];
  below50: number;
  notice: Notice | null;
}

const allPeople = (p: Persona) => p.teams.flatMap((t) => t.members);

function teamHome(persona: Persona, w: WindowKey): TeamHome {
  const r = windowRange(w);
  const people = allPeople(persona);
  const rows = people.map((p) => personRow(p, r)).sort(byPct);
  const counted = people.filter((p) => p.weeks[LAST].counted);
  const met = counted.filter((p) => p.weeks[LAST].adherent);
  const missed = counted.filter((p) => !p.weeks[LAST].adherent);

  const headline = missed.length === 0
    ? `All ${counted.length} people hit their 3 days.`
    : `${met.length} of ${counted.length} people hit their 3 days.`;

  const lines = missed.slice(0, 2).map((p) => {
    const wk = p.weeks[LAST];
    if (wk.missing.length) return `${first(p.name)} shows ${wk.credit} day${wk.credit === 1 ? '' : 's'}, but ${wk.missing.join(', ')} data is missing for that week.`;
    let streak = 0;
    for (let i = LAST; i >= 0 && p.weeks[i].counted && !p.weeks[i].adherent; i--) streak++;
    const base = `${first(p.name)} was in ${wk.credit} day${wk.credit === 1 ? '' : 's'}`;
    return streak >= 2 ? `${base}, the ${ordinal[streak] ?? `${streak}th`} short week in a row.` : `${base}.`;
  });
  const sub = missed.length === 0 ? 'Nothing needs your attention this week.' : lines.join(' ');

  return {
    tier: 'team', eyebrow: `Last week · ${rangeLabel(lastWeek)}`, headline, sub,
    summary: summary(people, r, windowRange(w, 1)), rows, notice: notice(people, r),
  };
}

function officeStats(people: Person[], r: Range): OfficeStat[] {
  const groups = new Map<string, Person[]>();
  people.forEach((p) => {
    const g = groups.get(p.officeId);
    if (g) g.push(p);
    else groups.set(p.officeId, [p]);
  });
  return [...groups.entries()].map(([id, ps]) => {
    const t = tally(ps, r);
    return { city: OFFICE_BY_ID[id].city, region: OFFICE_BY_ID[id].region, pct: pct(t), size: ps.length, pending: t.incomplete > 0 };
  }).sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101));
}

function orgHome(persona: Persona, w: WindowKey): OrgHome {
  const r = windowRange(w);
  const prev = windowRange(w, 1);
  const people = allPeople(persona);
  const teams = persona.teams.map((t) => teamRow(t, r, prev)).sort(byPct);
  const offices = officeStats(people, r);

  const regionNames = [...new Set(people.map(regionOfPerson))];
  const regions: RegionStat[] = regionNames.map((region) => {
    const ps = people.filter((p) => regionOfPerson(p) === region);
    return {
      region, pct: pct(tally(ps, r)), size: ps.length, cells: buckets(r).map((b) => groupCell(ps, b)),
      trend: trend(ps, r, false), offices: offices.filter((o) => o.region === region),
    };
  }).sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101));

  const below50 = people.filter((p) => { const v = pct(tally([p], r)); return v !== null && v < 50; }).length;
  const winWord = w === '1M' ? 'this month' : `over the ${w === '1Y' ? 'last year' : `last ${w.replace('M', '')} months`}`;

  let headline: string;
  let sub: string;
  if (persona.tier === 'org') {
    const low = teams.filter((t) => (t.pct ?? 100) < 75);
    headline = low.length
      ? `${low.length} of your ${teams.length} teams ${low.length === 1 ? 'is' : 'are'} below 75% ${winWord}.`
      : `All ${teams.length} of your teams are at 75% or above ${winWord}.`;
    // Talk about the teams that need attention first, then the rest.
    const focus = low.length ? low : teams;
    const drop = [...focus].sort((a, b) => (a.change ?? 0) - (b.change ?? 0))[0];
    const rise = [...focus].filter((t) => t !== drop).sort((a, b) => (b.change ?? 0) - (a.change ?? 0))[0] ?? drop;
    const parts: string[] = [];
    if (drop.change !== null && drop.change <= -2) parts.push(`${first(drop.name)}'s team slipped ${-drop.change} points.`);
    if (rise !== drop && rise.change !== null && rise.change >= 2) {
      const pend = rise.pendingPeople;
      parts.push(pend
        ? `${first(rise.name)}'s team is climbing, though ${pend} ${pend === 1 ? 'person is' : 'people are'} waiting on missing data.`
        : `${first(rise.name)}'s team is up ${rise.change} points.`);
    }
    sub = parts.join(' ') || 'No team moved more than 2 points.';
  } else {
    const lowOffices = offices.slice(0, 3).map((o) => o.city);
    headline = `${lowOffices[0]} has the lowest adherence ${winWord}, followed by ${lowOffices[1]} and ${lowOffices[2]}.`;
    const lowTeam = teams[0];
    sub = `${lowTeam.name}'s team in ${lowTeam.office} is the lowest of your ${teams.length} teams, at ${lowTeam.pct}%.`;
  }

  return {
    tier: persona.tier === 'org' ? 'org' : 'enterprise',
    eyebrow: `${w === '1M' ? 'This month' : `Last ${w === '1Y' ? 'year' : w.replace('M', ' months')}`} · ${rangeLabel(r)}`,
    headline, sub, summary: summary(people, r, prev), teams, offices, regions, below50, notice: notice(people, r),
  };
}

export const buildHome = (persona: Persona, w: WindowKey): TeamHome | OrgHome =>
  persona.tier === 'team' ? teamHome(persona, w) : orgHome(persona, w);
