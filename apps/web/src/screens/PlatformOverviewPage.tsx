import { useEffect, useState } from 'react';
import { api, formatWhen } from '../api';
import { PlatformShell, type PlatformSection } from '../components/PlatformShell';

type OverviewView = 'default' | 'empty' | 'loading';

const views: { id: OverviewView; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'empty', label: 'Empty' },
  { id: 'loading', label: 'Loading' },
];

const stats = [
  { label: 'Active clients', value: '24', dot: '#1f8a4c' },
  { label: 'Suspended', value: '2', dot: '#8a847c' },
  { label: 'Trials ending in 7 days', value: '5', dot: '#b58105' },
  { label: 'Past due', value: '3', dot: '#d92d20' },
  { label: 'Bookings today', value: '148', dot: '#8a847c' },
  { label: 'Seated today', value: '52', dot: '#1f8a4c' },
];

const trials = [
  { id: 'marine', name: 'Marine Spice', detail: 'Trial ends 24 Oct 2026 · Starter plan' },
  { id: 'saffron', name: 'Saffron House', detail: 'Kochi · Trial ends 26 Oct 2026 · Growth plan' },
];

type ApiClient = {
  id: string;
  name: string;
  subscription: {
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    plan: { name: string } | null;
  } | null;
};

const pastDue = [
  { id: 'lulu', name: 'Lulu Kitchen', detail: '₹4,999 due · Invoice INV-2026-118' },
];

type PlatformOverviewPageProps = {
  onSignOut: () => void;
  onNavigate: (section: PlatformSection) => void;
  onOpenClient: (clientId: string) => void;
};

export function PlatformOverviewPage({ onSignOut, onNavigate, onOpenClient }: PlatformOverviewPageProps) {
  const [view, setView] = useState<OverviewView>('default');
  const [figures, setFigures] = useState(stats);
  const [trialRows, setTrialRows] = useState(trials);
  const [dueRows, setDueRows] = useState(pastDue);
  const isEmpty = view === 'empty';
  const isLoading = view === 'loading';

  useEffect(() => {
    api<{
      activeClients: number;
      suspendedClients: number;
      trialsEndingWithin7Days: number;
      pastDue: number;
      bookingsToday: number;
      seatedToday: number;
    }>('/platform/overview')
      .then((data) => {
        setFigures([
          { label: 'Active clients', value: String(data.activeClients), dot: '#1f8a4c' },
          { label: 'Suspended', value: String(data.suspendedClients), dot: '#8a847c' },
          { label: 'Trials ending in 7 days', value: String(data.trialsEndingWithin7Days), dot: '#b58105' },
          { label: 'Past due', value: String(data.pastDue), dot: '#d92d20' },
          { label: 'Bookings today', value: String(data.bookingsToday), dot: '#8a847c' },
          { label: 'Seated today', value: String(data.seatedToday), dot: '#1f8a4c' },
        ]);
      })
      .catch(() => undefined);
    api<{ rows: ApiClient[] }>('/platform/clients?pageSize=100')
      .then((data) => {
        setTrialRows(
          data.rows
            .filter((row) => row.subscription?.status === 'TRIALING')
            .map((row) => ({
              id: row.id,
              name: row.name,
              detail: `${row.subscription?.plan?.name ?? 'Plan'} · Trial ends ${formatWhen(row.subscription?.trialEndsAt ?? '', false)}`,
            })),
        );
        setDueRows(
          data.rows
            .filter((row) => row.subscription?.status === 'PAST_DUE')
            .map((row) => ({
              id: row.id,
              name: row.name,
              detail: `Period ended ${formatWhen(row.subscription?.currentPeriodEnd ?? '', false)}`,
            })),
        );
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    document.title = 'DinePoint Platform · Overview';
  }, []);

  return (
    <PlatformShell active="overview" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="platform-page">
        <div className="inspect-bar floors-inspect">
          <span className="inspect-label">State demo:</span>
          <div role="group" aria-label="Inspect state">
            {views.map((item) => (
              <button
                key={item.id}
                type="button"
                className={view === item.id ? 'state-pill is-active' : 'state-pill'}
                aria-pressed={view === item.id}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <section aria-labelledby="overview-title">
          <h1 id="overview-title">Overview</h1>
          <p className="platform-kicker">Thursday, 22 Oct 2026 · India time</p>

          {isLoading ? (
            <div className="today-loading" role="status" aria-live="polite">
              <p>Loading overview…</p>
              <span className="skeleton-row" />
              <span className="skeleton-row" />
              <span className="skeleton-row" />
            </div>
          ) : (
            <>
              <div className="platform-stats">
                {(isEmpty ? figures.map((item) => ({ ...item, value: '0' })) : figures).map((item) => (
                  <article key={item.label}>
                    <p>
                      <i style={{ background: item.dot }} />
                      {item.label}
                    </p>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>

              <div className="platform-boards">
                <section>
                  <header>
                    <h2>
                      Trials ending soon
                      <span>{isEmpty ? 0 : trialRows.length}</span>
                    </h2>
                    <p>Action required</p>
                  </header>
                  {isEmpty ? (
                    <p className="platform-board-empty">No trials ending in the next 7 days.</p>
                  ) : (
                    trialRows.map((client) => (
                      <article key={client.id}>
                        <div>
                          <strong>{client.name}</strong>
                          <p>{client.detail}</p>
                        </div>
                        <span className="platform-chip is-trial">Trial</span>
                        <button type="button" onClick={() => onOpenClient(client.id)}>
                          Open client →
                        </button>
                      </article>
                    ))
                  )}
                </section>

                <section>
                  <header>
                    <h2>
                      Past due
                      <span className="is-alert">{isEmpty ? 0 : dueRows.length}</span>
                    </h2>
                    <p>Billing alert</p>
                  </header>
                  {isEmpty ? (
                    <p className="platform-board-empty">No past due invoices.</p>
                  ) : (
                    dueRows.map((client) => (
                      <article key={client.id}>
                        <div>
                          <strong>{client.name}</strong>
                          <p>{client.detail}</p>
                        </div>
                        <span className="platform-chip is-due">Past due</span>
                        <button type="button" onClick={() => onOpenClient(client.id)}>
                          Open client →
                        </button>
                      </article>
                    ))
                  )}
                </section>
              </div>
            </>
          )}
        </section>
      </div>
    </PlatformShell>
  );
}
