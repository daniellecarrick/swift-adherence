import { LAST, weekEnd, weekStart } from './generate';
import { OFFICE_BY_ID } from './offices';
import type { Feed, Person, Region, WindowKey } from './types';

export const WINDOW_WEEKS: Record<WindowKey, number> = { '1M': 4, '3M': 13, '6M': 26, '1Y': 52 };
export const WINDOW_LABEL: Record<WindowKey, string> = { '1M': 'last month', '3M': 'last 3 months', '6M': 'last 6 months', '1Y': 'last year' };

export interface Range { from: number; to: number } // inclusive week indexes

export const windowRange = (w: WindowKey, offset = 0): Range => {
  const n = WINDOW_WEEKS[w];
  const to = LAST - offset * n;
  return { from: to - n + 1, to };
};

/** Heatmap cells: one per week up to 13 weeks, otherwise one per month-sized chunk. */
export function buckets(r: Range): Range[] {
  const n = r.to - r.from + 1;
  const k = n <= 13 ? n : n === 26 ? 6 : 12;
  const out: Range[] = [];
  for (let b = 0; b < k; b++) {
    out.push({ from: r.from + Math.floor((b * n) / k), to: r.from + Math.floor(((b + 1) * n) / k) - 1 });
  }
  return out;
}

export interface Tally { adherent: number; counted: number; incomplete: number; missing: Set<Feed> }

export function tally(people: Person[], r: Range, skipIncomplete = false): Tally {
  const t: Tally = { adherent: 0, counted: 0, incomplete: 0, missing: new Set() };
  for (const p of people) {
    for (let i = r.from; i <= r.to; i++) {
      const w = p.weeks[i];
      if (!w.counted) continue;
      if (skipIncomplete && w.missing.length && !w.adherent) continue;
      t.counted++;
      if (w.adherent) t.adherent++;
      if (w.missing.length) {
        t.incomplete++;
        w.missing.forEach((f) => t.missing.add(f));
      }
    }
  }
  return t;
}

export const pct = (t: Tally) => (t.counted ? Math.round((100 * t.adherent) / t.counted) : null);

export type CellKind = 'met' | 'missed' | 'pending' | 'q1' | 'q2' | 'q3' | 'q4' | 'none';
export interface Cell { kind: CellKind; label: string }

export const quartile = (v: number): CellKind => (v >= 90 ? 'q4' : v >= 75 ? 'q3' : v >= 60 ? 'q2' : 'q1');

const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const rangeLabel = (r: Range) => `${fmt(weekStart(r.from))} to ${fmt(weekEnd(r.to))}`;

/** A person's cell: met/missed for a single week, a shade for a multi-week chunk. */
export function personCell(p: Person, r: Range): Cell {
  const t = tally([p], r);
  const when = rangeLabel(r);
  if (!t.counted) return { kind: 'none', label: `${when}: not counted (not employed 3+ days)` };
  const single = r.from === r.to;
  if (single) {
    const w = p.weeks[r.from];
    const parts = Object.entries(w.days).filter(([, n]) => n).map(([k, n]) => `${n} ${CREDIT_NAME[k as keyof typeof CREDIT_NAME]}`);
    const detail = parts.length ? parts.join(', ') : 'no credit days';
    if (w.missing.length && !w.adherent) return { kind: 'pending', label: `${when}: ${detail}. ${w.missing.join(', ')} data missing, may change` };
    return { kind: w.adherent ? 'met' : 'missed', label: `${when}: ${detail}${w.missing.length ? `. ${w.missing.join(', ')} data missing` : ''}` };
  }
  const v = pct(t)!;
  return { kind: t.incomplete ? 'pending' : quartile(v), label: `${when}: ${t.adherent} of ${t.counted} weeks met (${v}%)` };
}

export function groupCell(people: Person[], r: Range): Cell {
  const t = tally(people, r);
  const v = pct(t);
  const when = rangeLabel(r);
  if (v === null) return { kind: 'none', label: `${when}: no data` };
  if (t.incomplete) return { kind: 'pending', label: `${when}: ${v}% as reported. ${t.incomplete} person-weeks missing ${[...t.missing].join(', ')} data` };
  return { kind: quartile(v), label: `${when}: ${v}% of person-weeks met` };
}

export type Trend = 'up' | 'down' | 'steady';
/**
 * Compare this window with the one before it, the same comparison the hero uses.
 * Weeks that may be wrong because of missing data are left out, so a feed outage never reads as a decline.
 */
export function trend(people: Person[], r: Range, isPerson: boolean): Trend {
  const n = r.to - r.from + 1;
  const b = pct(tally(people, r, true));
  const a = pct(tally(people, { from: r.from - n, to: r.from - 1 }, true));
  if (a === null || b === null) return 'steady';
  const threshold = isPerson ? 20 : 4;
  return b - a >= threshold ? 'up' : a - b >= threshold ? 'down' : 'steady';
}

export const CREDIT_NAME = { badge: 'in office', pto: 'PTO', holiday: 'holiday', leave: 'leave', travel: 'travel' } as const;

export const regionOfPerson = (p: Person): Region => OFFICE_BY_ID[p.officeId].region;
export const cityOfPerson = (p: Person) => OFFICE_BY_ID[p.officeId].city;
