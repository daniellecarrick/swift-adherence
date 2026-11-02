import type { Cell } from '../data/adherence';
import type { Trend } from '../data/adherence';

export function Cells({ cells }: { cells: Cell[] }) {
  return (
    <div className={`cells${cells.length > 6 ? ' dense' : ''}`}>
      {cells.map((c, i) => (
        <span key={i} className={`cell ${c.kind}`} data-tip={c.label} tabIndex={0} role="img" aria-label={c.label} />
      ))}
    </div>
  );
}

const TREND = {
  up: ['↗', 'Improving'],
  down: ['↘', 'Worsening'],
  steady: ['→', 'Steady'],
} as const;

export function TrendTag({ trend }: { trend: Trend }) {
  const [icon, label] = TREND[trend];
  return (
    <span className={`trend ${trend}`}>
      <span aria-hidden="true">{icon}</span> {label}
    </span>
  );
}

export function Ring({ value, label }: { value: number | null; label: string }) {
  const c = 2 * Math.PI * 66;
  const v = value ?? 0;
  return (
    <svg width="132" height="132" viewBox="0 0 160 160" role="img" aria-label={label} style={{ flex: 'none' }}>
      <circle cx="80" cy="80" r="66" fill="none" stroke="#e4e7f0" strokeWidth="16" />
      <circle
        cx="80" cy="80" r="66" fill="none" stroke="var(--blue)" strokeWidth="16" strokeLinecap="round"
        strokeDasharray={`${(c * v) / 100} ${c}`} transform="rotate(-90 80 80)"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text x="80" y="91" textAnchor="middle" fontSize="34" fontWeight="700" fill="var(--ink)" fontFamily="inherit">
        {value === null ? '–' : `${value}%`}
      </text>
    </svg>
  );
}

export function Change({ value, against }: { value: number | null; against: string }) {
  if (value === null) return <div className="change flat">No earlier data to compare</div>;
  if (value === 0) return <div className="change flat">No change from {against}</div>;
  return (
    <div className={`change ${value > 0 ? 'up' : 'down'}`}>
      {value > 0 ? 'Up' : 'Down'} {Math.abs(value)} {Math.abs(value) === 1 ? 'pt' : 'pts'} from {against}
    </div>
  );
}

export function Legend({ kind }: { kind: 'person' | 'group' }) {
  return (
    <div className="legend" aria-label="Legend">
      {kind === 'person' ? (
        <>
          <span><i className="k-met" />Met</span>
          <span><i className="k-missed" />Missed</span>
        </>
      ) : (
        <span>
          <i className="k-q1" /><i className="k-q2" /><i className="k-q3" /><i className="k-q4" />
          <span style={{ marginLeft: 4 }}>Under 60% to 90%+</span>
        </span>
      )}
      <span><i className="k-pending" />Data pending</span>
    </div>
  );
}

export const Chevron = ({ down = false }: { down?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={down ? { transform: 'rotate(90deg)' } : undefined}>
    <path d="M5 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const initials = (name: string) => name.split(' ').filter((s) => /^[A-Za-zÀ-ž]/.test(s) && !s.endsWith('.')).map((s) => s[0]).slice(0, 2).join('');
