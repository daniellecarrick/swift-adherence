import { makeRng, clamp, type Rng } from './random';
import { OFFICE_BY_ID, officeId } from './offices';
import { nameMaker } from './names';
import type { Feed, Person, PersonWeek, Persona, Region, Team } from './types';

export const WEEK_COUNT = 104; // two years, so every window has a prior window to compare against
export const LAST = WEEK_COUNT - 1;
const LAST_WEEK_START = new Date(2026, 9, 19); // Mon Oct 19 2026; data runs through Sun Oct 25

export function weekStart(i: number) {
  const d = new Date(LAST_WEEK_START);
  d.setDate(d.getDate() - (LAST - i) * 7);
  return d;
}
export function weekEnd(i: number) {
  const d = weekStart(i);
  d.setDate(d.getDate() + 6);
  return d;
}

/** Probability of an adherent week: flat at `start`, then a straight line to `end` over the last 8 weeks. */
interface Profile {
  start: number;
  end: number;
}
const probAt = (p: Profile, i: number) => {
  const rampFrom = LAST - 7;
  if (i < rampFrom) return p.start;
  return p.start + ((p.end - p.start) * (i - rampFrom)) / 7;
};

function makeWeek(rng: Rng, adherent: boolean): PersonWeek {
  const credit = adherent ? rng.pick([3, 3, 3, 4, 4, 5]) : rng.pick([0, 1, 2, 2, 2]);
  const days: PersonWeek['days'] = {};
  let left = credit;
  if (left > 0 && rng.next() < 0.1) { days.pto = 1; left -= 1; }
  if (left > 0 && rng.next() < 0.05) { days.travel = 1; left -= 1; }
  if (left > 0) days.badge = left;
  return { days, credit, adherent, counted: true, missing: [] };
}

/** Build a week from an exact badge count, used for hand-authored people. */
function exactWeek(badge: number, extra: Partial<PersonWeek['days']> = {}, missing: Feed[] = []): PersonWeek {
  const days = { badge, ...extra };
  const credit = Math.min(5, Object.values(days).reduce((a, b) => a + (b ?? 0), 0));
  return { days, credit, adherent: credit >= 3, counted: true, missing };
}

let pid = 0;
/**
 * People are habitual: each person is either a "regular" (usually in 3+ days) or "irregular" in a given week.
 * A team's adherence profile sets what share of its people are regulars, and a person's fixed draw `u`
 * decides whether they stay a regular as that share moves. This keeps team numbers stable week to week.
 */
function genPerson(rng: Rng, name: string, city: string, teamId: string, team: Profile, u = rng.next(), hireWeek?: number): Person {
  const hi = clamp(rng.normal(0.97, 0.02), 0.9, 0.995);
  const lo = clamp(rng.normal(0.3, 0.12), 0.05, 0.55);
  const weeks: PersonWeek[] = [];
  for (let i = 0; i < WEEK_COUNT; i++) {
    const share = clamp((probAt(team, i) - 0.3) / 0.67, 0, 1);
    const w = makeWeek(rng, rng.next() < (u < share ? hi : lo));
    if (hireWeek !== undefined && i < hireWeek) {
      w.counted = false;
      w.adherent = false;
      w.credit = 0;
      w.days = {};
    }
    weeks.push(w);
  }
  return { id: `p${pid++}`, name, officeId: officeId(city), teamId, weeks };
}

/** Evenly spread draws, shuffled, so a team's share of regulars matches its profile exactly. */
function stratified(rng: Rng, n: number) {
  const out = Array.from({ length: n }, (_, k) => (k + rng.next()) / n);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const regionOf = (city: string): Region => OFFICE_BY_ID[officeId(city)].region;

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

function buildPriya(rng: Rng): Persona {
  const teamId = 't-priya';
  const high = { start: 0.8, end: 0.8 };
  // Last four weeks are hand-authored so the story is exact. Earlier weeks are generated.
  const authored: [string, string, (PersonWeek)[]][] = [
    ['Jordan Lee', 'New York', [exactWeek(3), exactWeek(2), exactWeek(2), exactWeek(2)]],
    ['Alex Kim', 'New York', [exactWeek(3), exactWeek(4), exactWeek(3), exactWeek(1, {}, ['PTO'])]],
    ['Maria Gonzalez', 'New York', [exactWeek(3), exactWeek(3, { pto: 1 }), exactWeek(2), exactWeek(3)]],
    ['Sam Patel', 'Jersey City', [exactWeek(4), exactWeek(3), exactWeek(4), exactWeek(4)]],
    ['Chris Okafor', 'New York', [exactWeek(3), exactWeek(3), exactWeek(3), exactWeek(3)]],
    ['Taylor Brooks', 'Toronto', [exactWeek(5), exactWeek(4), exactWeek(5), exactWeek(5)]],
    ['Nina Rossi', 'London', [exactWeek(3), exactWeek(2, { travel: 1 }), exactWeek(3), exactWeek(3)]],
  ];
  const us = stratified(rng, authored.length);
  const members = authored.map(([name, city, last4], k) => {
    const p = genPerson(rng, name, city, teamId, high, us[k]);
    p.weeks.splice(LAST - 3, 4, ...last4);
    // Jordan was reliable until recently, so his slide reads as a change worth a conversation.
    if (name === 'Jordan Lee') for (let i = LAST - 7; i <= LAST - 4; i++) p.weeks[i] = exactWeek(3);
    return p;
  });
  return {
    id: 'priya', name: 'Priya Raman', initials: 'PR', title: 'VP, Operations Risk · New York', tier: 'team',
    teams: [{ id: teamId, managerName: 'Priya Raman', officeLabel: 'New York', members }],
  };
}

function buildKenji(rng: Rng): Persona {
  const teamId = 't-kenji';
  const members = ['Yuki Tanaka', 'Hiroshi Nakamura', 'Haruka Suzuki', 'Takumi Yamamoto'].map((n) =>
    genPerson(rng, n, 'Tokyo', teamId, { start: 0.95, end: 0.97 }),
  );
  members.forEach((m) => {
    for (let i = LAST - 3; i <= LAST; i++) if (!m.weeks[i].adherent) m.weeks[i] = exactWeek(3);
  });
  return {
    id: 'kenji', name: 'Kenji Sato', initials: 'KS', title: 'AVP, Treasury Services · Tokyo', tier: 'team',
    teams: [{ id: teamId, managerName: 'Kenji Sato', officeLabel: 'Tokyo', members }],
  };
}

function buildMarcus(rng: Rng): Persona {
  const name = nameMaker(rng.pick);
  const spec: [string, number, string[], Profile][] = [
    ['Rafael Costa', 31, ['São Paulo'], { start: 0.72, end: 0.56 }],
    ['Ana Ribeiro', 24, ['São Paulo', 'Bogotá'], { start: 0.56, end: 0.76 }],
    ['Diego Alves', 18, ['São Paulo'], { start: 0.79, end: 0.8 }],
    ['Lucas Mendes', 27, ['Rio de Janeiro'], { start: 0.84, end: 0.85 }],
    ['Beatriz Santos', 22, ['São Paulo'], { start: 0.82, end: 0.9 }],
    ['Paulo Ferreira', 18, ['São Paulo'], { start: 0.92, end: 0.93 }],
  ];
  const teams: Team[] = spec.map(([mgr, size, cities, prof], ti) => {
    const id = `t-m${ti}`;
    const members: Person[] = [];
    const us = stratified(rng, size);
    for (let k = 0; k < size; k++) {
      const city = cities[k % cities.length];
      const hire = mgr === 'Diego Alves' && k === 0 ? LAST - 2 : undefined; // a new hire, to exercise the rule
      members.push(genPerson(rng, name(regionOf(city)), city, id, prof, us[k], hire));
    }
    return { id, managerName: mgr, officeLabel: cities.join(', '), members };
  });
  // Leave feed delayed for three people on Ana's team last week.
  const ana = teams[1].members;
  [0, 3, 7].forEach((k, j) => {
    ana[k].weeks[LAST] = j === 0 ? exactWeek(2, {}, ['Leave']) : exactWeek(3, {}, ['Leave']);
  });
  return { id: 'marcus', name: 'Marcus Oliveira', initials: 'MO', title: 'Director, Technology · São Paulo', tier: 'org', teams };
}

function buildCatherine(rng: Rng): Persona {
  const name = nameMaker(rng.pick);
  const offices: [string, number, Profile][] = [
    ['Frankfurt', 140, { start: 0.68, end: 0.59 }],
    ['Mexico City', 95, { start: 0.7, end: 0.68 }],
    ['Singapore', 120, { start: 0.76, end: 0.71 }],
    ['Dublin', 88, { start: 0.76, end: 0.78 }],
    ['Toronto', 64, { start: 0.77, end: 0.76 }],
    ['London', 310, { start: 0.79, end: 0.79 }],
    ['Paris', 120, { start: 0.8, end: 0.8 }],
    ['Madrid', 70, { start: 0.78, end: 0.78 }],
    ['Zurich', 92, { start: 0.84, end: 0.84 }],
    ['Hong Kong', 150, { start: 0.82, end: 0.82 }],
    ['Tokyo', 90, { start: 0.85, end: 0.85 }],
    ['Sydney', 50, { start: 0.8, end: 0.81 }],
    ['São Paulo', 95, { start: 0.83, end: 0.83 }],
    ['Chicago', 120, { start: 0.85, end: 0.85 }],
    ['New York', 520, { start: 0.89, end: 0.9 }],
    ['Boston', 110, { start: 0.86, end: 0.86 }],
    ['Charlotte', 96, { start: 0.88, end: 0.88 }],
    ['San Francisco', 70, { start: 0.84, end: 0.84 }],
  ];
  const named: Record<string, [string, number, Profile][]> = {
    Frankfurt: [['Jonas Weber', 22, { start: 0.54, end: 0.34 }]],
    'Mexico City': [['Lucía Herrera', 15, { start: 0.57, end: 0.54 }]],
    Singapore: [['Wei Ling Tan', 31, { start: 0.66, end: 0.55 }]],
    Dublin: [['Hannah Byrne', 12, { start: 0.55, end: 0.66 }]],
    London: [['Omar Haddad', 26, { start: 0.57, end: 0.68 }]],
  };
  const teams: Team[] = [];
  let ti = 0;
  for (const [city, headcount, prof] of offices) {
    let left = headcount;
    const queue = [...(named[city] ?? [])];
    while (left > 0) {
      const preset = queue.shift();
      let size = preset ? preset[1] : Math.min(left, rng.int(14, 28));
      if (!preset && left - size > 0 && left - size < 8) size = left; // no tiny leftover teams
      const tprof = preset ? preset[2] : {
        start: clamp(prof.start + rng.normal(0, 0.06), 0.4, 0.98),
        end: 0,
      };
      if (!preset) tprof.end = clamp(tprof.start + (prof.end - prof.start) + rng.normal(0, 0.04), 0.35, 0.98);
      const id = `t-c${ti++}`;
      const members: Person[] = [];
      const us = stratified(rng, size);
      for (let k = 0; k < size; k++) members.push(genPerson(rng, name(regionOf(city)), city, id, tprof, us[k]));
      teams.push({ id, managerName: preset ? preset[0] : name(regionOf(city)), officeLabel: city, members });
      left -= size;
    }
  }
  // Leave feed delayed for 112 people in EMEA last week. Some lost real leave credit, so they look worse than they are.
  const emea = teams.flatMap((t) => t.members).filter((p) => OFFICE_BY_ID[p.officeId].region === 'EMEA');
  for (let k = 0; k < 112; k++) {
    const p = emea[(k * 7) % emea.length];
    const w = p.weeks[LAST];
    const lost = rng.next() < 0.35;
    p.weeks[LAST] = lost ? exactWeek(Math.min(2, w.days.badge ?? 0), {}, ['Leave']) : { ...w, missing: ['Leave'] };
  }
  return { id: 'catherine', name: 'Catherine Wu', initials: 'CW', title: 'Managing Director, Global Markets · London', tier: 'enterprise', teams };
}

export function buildPersonas(seed = 20261025): Persona[] {
  pid = 0;
  const rng = makeRng(seed);
  return [buildPriya(rng), buildKenji(rng), buildMarcus(rng), buildCatherine(rng)];
}
