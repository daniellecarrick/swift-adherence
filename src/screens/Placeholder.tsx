import type { Page } from '../components/Header';

const COPY: Record<Exclude<Page, 'home'>, [string, string]> = {
  people: ['People', 'A searchable, sortable table of everyone in your scope, with filters for adherent, non-adherent and data issues. Each person opens to a week-by-week calendar showing every credit day by type.'],
  managers: ['Managers', 'Your org as a hierarchy you can drill through, from org to manager to team to person, sorted by adherence or size, with Escalate on every manager.'],
  locations: ['Locations', 'Adherence by region, then office, then the teams sitting in each office. You only see offices where your people work.'],
  how: ['How adherence works', 'A week counts as adherent with 3 or more credit days. Badge swipes, PTO, holidays, approved leave, business travel and office closures all earn credit. Adherence is adherent weeks divided by counted weeks in the window.'],
};

export function Placeholder({ page, onHome }: { page: Exclude<Page, 'home'>; onHome: () => void }) {
  const [title, body] = COPY[page];
  return (
    <section className="placeholder">
      <div className="eyebrow">Coming in the next build</div>
      <h1>{title}</h1>
      <p>{body}</p>
      <button className="link-btn" type="button" onClick={onHome}>Back to Home</button>
    </section>
  );
}
