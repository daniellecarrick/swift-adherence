import type { OfficeStat, OrgHome, TeamHome } from '../data/model';
import type { Persona, WindowKey } from '../data/types';
import { PeopleTable, TeamsTable, type Action } from '../components/AdherenceTable';
import { Cells, Change, Legend, Ring, TrendTag } from '../components/bits';

const PRIOR: Record<WindowKey, string> = { '1M': 'the month before', '3M': 'the 3 months before', '6M': 'the 6 months before', '1Y': 'the year before' };
const WIN: Record<WindowKey, string> = { '1M': 'last 4 weeks', '3M': 'last 13 weeks', '6M': 'last 6 months', '1Y': 'last 12 months' };

interface Props {
  persona: Persona;
  home: TeamHome | OrgHome;
  win: WindowKey;
  escalations: number;
  onAction: (a: Action) => void;
  onDataStatus: () => void;
}

export function Home({ persona, home, win, escalations, onAction, onDataStatus }: Props) {
  const s = home.summary;
  const scope = home.tier === 'team' ? 'Team' : 'Your org';
  return (
    <>
      <section className="hero">
        <div className="hero-main">
          <div className="eyebrow">{home.eyebrow}</div>
          <h1>{home.headline}</h1>
          <p>{home.sub}</p>
        </div>
        <div className="hero-stat">
          <Ring value={s.pct} label={`${s.pct}% ${scope.toLowerCase()} adherence`} />
          <div>
            <h2>{scope}, {WIN[win]}</h2>
            <div className="sub">
              {home.tier === 'team'
                ? `${s.adherent} of ${s.counted} weeks met`
                : `${s.people.toLocaleString()} people · ${home.teams.length} teams`}
            </div>
            <Change value={s.change} against={PRIOR[win]} />
          </div>
        </div>
      </section>

      {home.tier === 'enterprise' && <RegionsOffices home={home} />}

      <section className="card">
        <div className="card-head">
          <div>
            <h2>{home.tier === 'team' ? 'Your people' : home.tier === 'org' ? 'Your teams' : 'Teams across your org'}</h2>
            <div className="sub">
              Lowest adherence first · {WIN[win]}
              {home.tier !== 'team' && ' · expand a team to see its people'}
            </div>
          </div>
          <Legend kind={home.tier === 'team' ? (win === '1M' || win === '3M' ? 'person' : 'group') : 'group'} />
        </div>
        {home.tier === 'team' ? (
          <PeopleTable rows={home.rows} onAction={onAction} />
        ) : (
          <TeamsTable key={`${persona.id}-${win}`} rows={home.teams} limit={home.tier === 'enterprise' ? 10 : undefined} onAction={onAction} />
        )}
      </section>

      {home.tier === 'org' && (
        <section className="split">
          <div className="card">
            <div className="card-head"><h2 style={{ fontSize: 20 }}>Your offices</h2></div>
            {home.offices.map((o) => <OfficeBar key={o.city} o={o} />)}
          </div>
          <div className="stats">
            <div className="stat"><span>Below 50%, {WIN[win]}</span><b>{home.below50} {home.below50 === 1 ? 'person' : 'people'}</b></div>
            <div className="stat"><span>Escalations you sent</span><b>{escalations} this session</b></div>
          </div>
        </section>
      )}

      {home.notice && (
        <div className="notice" role="status">
          <i aria-hidden="true" />
          <span>{home.notice.text} Data through Sun, Oct 25.</span>
          <button className="link-btn" type="button" onClick={onDataStatus}>Data status</button>
        </div>
      )}
    </>
  );
}

function OfficeBar({ o }: { o: OfficeStat }) {
  const v = o.pct ?? 0;
  const cls = o.pending ? `pt${v >= 75 ? ' hi' : ''}` : v < 75 ? 'lo' : '';
  return (
    <div className="office">
      <div className="office-top">
        <span style={{ fontWeight: 600 }}>{o.city}</span>
        <span><b>{o.pct}%</b> · {o.size.toLocaleString()} people</span>
      </div>
      <div className="trk" role="img" aria-label={`${o.city}: ${o.pct}%${o.pending ? ', some data pending' : ''}`}>
        <div className={`fl ${cls}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function RegionsOffices({ home }: { home: OrgHome }) {
  const offices = home.offices.length;
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Regions and offices</h2>
          <div className="sub">Lowest adherence first · {home.regions.length} regions · {offices} offices</div>
        </div>
      </div>
      <div className="regions">
        {home.regions.map((r) => (
          <div className="region" key={r.region}>
            <div className="region-top"><span>{r.region}</span><b>{r.pct}%</b></div>
            <Cells cells={r.cells} />
            <div className="region-meta">{r.size.toLocaleString()} people · <TrendTag trend={r.trend} /></div>
            <div className="region-offices">
              {r.offices.slice(0, 3).map((o) => <OfficeBar key={o.city} o={o} />)}
              {r.offices.length > 3 && <span className="region-meta">+ {r.offices.length - 3} more {r.offices.length === 4 ? 'office' : 'offices'}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
