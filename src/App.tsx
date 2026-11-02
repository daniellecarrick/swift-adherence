import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildPersonas } from './data/generate';
import { buildHome } from './data/model';
import { WINDOW_LABEL } from './data/adherence';
import type { WindowKey } from './data/types';
import { Header, NAV, type Page } from './components/Header';
import { Composer } from './components/Composer';
import type { Action } from './components/AdherenceTable';
import { Home } from './screens/Home';
import { Placeholder } from './screens/Placeholder';

const PERSONAS = buildPersonas();
const WINDOWS: WindowKey[] = ['1M', '3M', '6M', '1Y'];

// View state lives in the URL so the case study can deep-link to any persona and window.
function readUrl() {
  const q = new URLSearchParams(window.location.search);
  const as = PERSONAS.find((p) => p.id === q.get('as'))?.id ?? 'priya';
  const w = (WINDOWS as string[]).includes(q.get('w') ?? '') ? (q.get('w') as WindowKey) : '1M';
  const page = (q.get('page') as Page) || 'home';
  return { as, w, page };
}

export default function App() {
  const initial = readUrl();
  const [personaId, setPersonaId] = useState(initial.as);
  const [win, setWin] = useState<WindowKey>(initial.w);
  const [page, setPage] = useState<Page>(initial.page);
  const [action, setAction] = useState<Action | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sent, setSent] = useState<Record<string, number>>({});

  const persona = PERSONAS.find((p) => p.id === personaId)!;
  const validPage = NAV[persona.tier].some(([k]) => k === page) ? page : 'home';
  const home = useMemo(() => buildHome(persona, win), [persona, win]);

  useEffect(() => {
    const q = new URLSearchParams({ as: personaId, w: win });
    if (validPage !== 'home') q.set('page', validPage);
    window.history.replaceState(null, '', `${window.location.pathname}?${q}`);
  }, [personaId, win, validPage]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const closeComposer = useCallback(() => setAction(null), []);

  return (
    <div className="page">
      <div className="wrap">
        <Header
          personas={PERSONAS} persona={persona} onPersona={(id) => { setPersonaId(id); setPage('home'); }}
          page={validPage} onPage={setPage} win={win} onWin={setWin}
        />
        <main style={{ display: 'contents' }}>
          {validPage === 'home' ? (
            <Home
              persona={persona} home={home} win={win} escalations={sent[persona.id] ?? 0}
              onAction={setAction} onDataStatus={() => setToast('Data status is coming in the next build.')}
            />
          ) : (
            <Placeholder page={validPage} onHome={() => setPage('home')} />
          )}
        </main>
      </div>
      {action && (
        <Composer
          action={action} windowLabel={WINDOW_LABEL[win]} fromName={persona.name} onClose={closeComposer}
          onSent={(msg) => {
            if (action.kind === 'escalate') setSent((s) => ({ ...s, [persona.id]: (s[persona.id] ?? 0) + 1 }));
            setAction(null);
            setToast(msg);
          }}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
