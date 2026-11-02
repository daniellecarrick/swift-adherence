import { Fragment, useState } from 'react';
import type { PersonRow, TeamRow } from '../data/model';
import { Cells, Chevron, TrendTag, initials } from './bits';

export type Action = { kind: 'message'; row: PersonRow } | { kind: 'escalate'; row: TeamRow };

function PersonTr({ r, member, onAction }: { r: PersonRow; member?: boolean; onAction: (a: Action) => void }) {
  return (
    <tr className={member ? 'member' : undefined}>
      <td>
        <div className={`namecell${member ? ' indent' : ''}`}>
          <span className={`avatar${member ? ' sm' : ''}`} aria-hidden="true">{initials(r.name)}</span>
          <div>
            <div className="n">{r.name}</div>
            {!member && <div className="s">{r.note}</div>}
          </div>
        </div>
      </td>
      <td>{r.office}</td>
      <td>{r.region}</td>
      <td><Cells cells={r.cells} /></td>
      <td className="num">{r.pct === null ? '–' : `${r.pct}%`}</td>
      <td><TrendTag trend={r.trend} /></td>
      <td style={{ textAlign: 'right' }}>
        <button className="rowbtn" type="button" onClick={() => onAction({ kind: 'message', row: r })}>Message</button>
      </td>
    </tr>
  );
}

const MEMBER_PREVIEW = 6;

export function PeopleTable({ rows, onAction }: { rows: PersonRow[]; onAction: (a: Action) => void }) {
  return (
    <div className="table-scroll">
      <table className="adh">
        <Head />
        <tbody>{rows.map((r) => <PersonTr key={r.id} r={r} onAction={onAction} />)}</tbody>
      </table>
    </div>
  );
}

export function TeamsTable({ rows, limit, onAction }: { rows: TeamRow[]; limit?: number; onAction: (a: Action) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => (rows[0] ? { [rows[0].id]: true } : {}));
  const [showAll, setShowAll] = useState(false);
  const visible = limit && !showAll ? rows.slice(0, limit) : rows;
  return (
    <>
      <div className="table-scroll">
        <table className="adh">
          <Head />
          <tbody>
            {visible.map((t) => {
              const isOpen = !!open[t.id];
              const members = isOpen ? t.members() : [];
              return (
                <Fragment key={t.id}>
                  <tr>
                    <td>
                      <div className="namecell">
                        <button
                          className="chev" type="button" aria-expanded={isOpen}
                          aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${t.name}'s team`}
                          onClick={() => setOpen((o) => ({ ...o, [t.id]: !isOpen }))}
                        >
                          <Chevron />
                        </button>
                        <div>
                          <div className="n">{t.name}'s team</div>
                          <div className="s">{t.size} people</div>
                        </div>
                      </div>
                    </td>
                    <td>{t.office}</td>
                    <td>{t.region}</td>
                    <td><Cells cells={t.cells} /></td>
                    <td className="num">{t.pct === null ? '–' : `${t.pct}%`}</td>
                    <td><TrendTag trend={t.trend} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="rowbtn" type="button" onClick={() => onAction({ kind: 'escalate', row: t })}>Escalate</button>
                    </td>
                  </tr>
                  {members.slice(0, MEMBER_PREVIEW).map((m) => <PersonTr key={m.id} r={m} member onAction={onAction} />)}
                  {isOpen && members.length > MEMBER_PREVIEW && (
                    <tr className="member">
                      <td colSpan={7} style={{ paddingLeft: 52 }}>
                        <span style={{ fontSize: 14, color: 'var(--muted)' }}>
                          Showing the {MEMBER_PREVIEW} lowest of {members.length} people on {t.name.split(' ')[0]}'s team
                        </span>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {limit && rows.length > limit && (
        <button className="link-btn" type="button" onClick={() => setShowAll((s) => !s)}>
          {showAll ? `Show the ${limit} lowest teams` : `Show all ${rows.length} teams`}
        </button>
      )}
    </>
  );
}

function Head() {
  return (
    <thead>
      <tr>
        <th>Name</th>
        <th>Office</th>
        <th>Region</th>
        <th>Weeks</th>
        <th style={{ textAlign: 'right' }}>Adherence</th>
        <th>Trend</th>
        <th><span className="vh">Actions</span></th>
      </tr>
    </thead>
  );
}
