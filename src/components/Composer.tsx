import { useEffect, useRef, useState } from 'react';
import type { Action } from './AdherenceTable';

type Channel = 'Teams' | 'Email';

interface Props {
  action: Action;
  windowLabel: string;
  fromName: string;
  onClose: () => void;
  onSent: (summary: string) => void;
}

function draft(a: Action, windowLabel: string, from: string) {
  const first = a.row.name.split(' ')[0];
  const sign = `\n\nThanks,\n${from.split(' ')[0]}`;
  if (a.kind === 'message') {
    const pct = a.row.pct === null ? 'not yet measured' : `${a.row.pct}%`;
    return `Hi ${first},\n\nQuick check-in on office days. Over the ${windowLabel}, your adherence is ${pct} against the 3-days-a-week policy. I've attached your weekly breakdown.\n\nIs anything making it harder to come in? Happy to talk it through.${sign}`;
  }
  const change = a.row.change === null ? '' : a.row.change === 0 ? ', unchanged from the period before' : `, ${a.row.change > 0 ? 'up' : 'down'} ${Math.abs(a.row.change)} points from the period before`;
  return `Hi ${first},\n\nYour team's adherence is ${a.row.pct}% over the ${windowLabel}${change}. I've attached the team report with weekly detail for each person.\n\nCould you follow up this week with the people below the requirement and let me know if there's context I'm missing?${sign}`;
}

export function Composer({ action, windowLabel, fromName, onClose, onSent }: Props) {
  const [channel, setChannel] = useState<Channel>('Teams');
  const [body, setBody] = useState(() => draft(action, windowLabel, fromName));
  const dialogRef = useRef<HTMLDivElement>(null);
  const title = action.kind === 'message' ? `Message ${action.row.name}` : `Escalate to ${action.row.name}`;
  const file = action.kind === 'message'
    ? `${action.row.name.replace(/\W+/g, '-')}-adherence.pdf`
    : `${action.row.name.replace(/\W+/g, '-')}-team-adherence.pdf`;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('textarea')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [onClose]);

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="composer-title" ref={dialogRef}>
        <h2 id="composer-title">{title}</h2>
        <div className="seg" role="group" aria-label="Send with" style={{ alignSelf: 'flex-start' }}>
          {(['Teams', 'Email'] as Channel[]).map((c) => (
            <button key={c} type="button" aria-pressed={channel === c} onClick={() => setChannel(c)}>{c}</button>
          ))}
        </div>
        <label>
          To
          <input value={action.row.name} readOnly />
        </label>
        <label>
          Message
          <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <div className="attach">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M11.5 5.5l-5 5a1.8 1.8 0 002.5 2.5l5.5-5.5a3.2 3.2 0 00-4.5-4.5L4.5 8.5a4.6 4.6 0 006.5 6.5l4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span><b>{file}</b> · {windowLabel}, weekly detail</span>
        </div>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button
            type="button" className="btn primary"
            onClick={() => onSent(`${action.kind === 'message' ? 'Message' : 'Escalation'} sent to ${action.row.name.split(' ')[0]} on ${channel}, report attached. (Demo: nothing was actually sent.)`)}
          >
            Send on {channel}
          </button>
        </div>
      </div>
    </div>
  );
}
