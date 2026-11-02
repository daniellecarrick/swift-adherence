import { useEffect, useRef, useState } from 'react';
import type { Persona, Tier, WindowKey } from '../data/types';
import { Chevron } from './bits';

export type Page = 'home' | 'people' | 'managers' | 'locations' | 'how';

export const NAV: Record<Tier, [Page, string][]> = {
  team: [['home', 'Home'], ['people', 'People'], ['how', 'How it works']],
  org: [['home', 'Home'], ['managers', 'Managers'], ['locations', 'Locations'], ['people', 'People'], ['how', 'How it works']],
  enterprise: [['home', 'Home'], ['locations', 'Locations'], ['managers', 'Managers'], ['people', 'People'], ['how', 'How it works']],
};

const TIER_LABEL: Record<Tier, string> = { team: 'Team view', org: 'Org view', enterprise: 'Enterprise view' };

interface Props {
  personas: Persona[];
  persona: Persona;
  onPersona: (id: string) => void;
  page: Page;
  onPage: (p: Page) => void;
  win: WindowKey;
  onWin: (w: WindowKey) => void;
}

export function Header({ personas, persona, onPersona, page, onPage, win, onWin }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const size = (p: Persona) => p.teams.reduce((n, t) => n + t.members.length, 0).toLocaleString();

  return (
    <header className="header">
      <div className="brand">
        <div className="logo" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="wordmark">Swift Bank Adherence</div>
        <div className="switcher" ref={ref}>
          <button className="who" type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="avatar me" aria-hidden="true">{persona.initials}</span>
            <span style={{ textAlign: 'left' }}>
              <small>Viewing as</small>
              <strong>{persona.name}</strong>
            </span>
            <Chevron down />
          </button>
          {open && (
            <div className="menu" role="menu" aria-label="Switch view">
              <div className="menu-label">Demo · view the dashboard as</div>
              {personas.map((p) => (
                <button
                  key={p.id} type="button" role="menuitem" className="opt" aria-current={p.id === persona.id}
                  onClick={() => { onPersona(p.id); setOpen(false); }}
                >
                  <span className={`avatar${p.id === persona.id ? ' me' : ''}`} aria-hidden="true">{p.initials}</span>
                  <span>
                    <b>{p.name}</b>
                    <span>{TIER_LABEL[p.tier]} · {size(p)} people</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <nav className="nav" aria-label="Main">
        {NAV[persona.tier].map(([key, label]) => (
          <button key={key} type="button" aria-current={page === key ? 'page' : undefined} onClick={() => onPage(key)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="seg" role="group" aria-label="Time window">
        {(['1M', '3M', '6M', '1Y'] as WindowKey[]).map((w) => (
          <button key={w} type="button" aria-pressed={win === w} onClick={() => onWin(w)}>{w}</button>
        ))}
      </div>
    </header>
  );
}
