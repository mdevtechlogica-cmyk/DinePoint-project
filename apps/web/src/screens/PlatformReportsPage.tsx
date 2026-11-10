import { useEffect, useState } from 'react';
import { api, apiText } from '../api';
import { PlatformShell, type PlatformSection } from '../components/PlatformShell';

type ReportView = 'default' | 'empty' | 'loading' | 'custom';

type ReportSnapshot = {
  id: string;
  label: string;
  chip: string;
  reportId: string;
  clients: { label: string; value: number; dot: string }[];
  subscriptions: { label: string; value: number; dot: string }[];
  bookings: { label: string; value: number; dot: string }[];
};

const ranges: ReportSnapshot[] = [
  {
    id: 'oct-15-22',
    label: '15 Oct 2026 – 22 Oct 2026',
    chip: '15 Oct – 22 Oct 2026',
    reportId: 'PLT-2026-OCT-22',
    clients: [
      { label: 'New in range', value: 4, dot: '#1f8a4c' },
      { label: 'Active now', value: 24, dot: '#1f8a4c' },
      { label: 'Suspended now', value: 2, dot: '#8a847c' },
    ],
    subscriptions: [
      { label: 'Trialing', value: 6, dot: '#d0891f' },
      { label: 'Active', value: 15, dot: '#1f8a4c' },
      { label: 'Past due', value: 3, dot: '#d92d20' },
      { label: 'Cancelled', value: 2, dot: '#8a847c' },
      { label: 'Expired', value: 0, dot: '#8a847c' },
    ],
    bookings: [
      { label: 'Total', value: 860, dot: '#1c1c1c' },
      { label: 'Seated', value: 210, dot: '#1f8a4c' },
      { label: 'Completed', value: 540, dot: '#8a847c' },
      { label: 'Cancelled', value: 70, dot: '#d92d20' },
      { label: 'No-show', value: 24, dot: '#24324a' },
      { label: 'Pending', value: 16, dot: '#d0891f' },
    ],
  },
  {
    id: 'oct-01-22',
    label: '1 Oct 2026 – 22 Oct 2026',
    chip: '1 Oct – 22 Oct 2026',
    reportId: 'PLT-2026-OCT-01',
    clients: [
      { label: 'New in range', value: 11, dot: '#1f8a4c' },
      { label: 'Active now', value: 24, dot: '#1f8a4c' },
      { label: 'Suspended now', value: 2, dot: '#8a847c' },
    ],
    subscriptions: [
      { label: 'Trialing', value: 6, dot: '#d0891f' },
      { label: 'Active', value: 15, dot: '#1f8a4c' },
      { label: 'Past due', value: 3, dot: '#d92d20' },
      { label: 'Cancelled', value: 2, dot: '#8a847c' },
      { label: 'Expired', value: 0, dot: '#8a847c' },
    ],
    bookings: [
      { label: 'Total', value: 2140, dot: '#1c1c1c' },
      { label: 'Seated', value: 480, dot: '#1f8a4c' },
      { label: 'Completed', value: 1410, dot: '#8a847c' },
      { label: 'Cancelled', value: 160, dot: '#d92d20' },
      { label: 'No-show', value: 52, dot: '#24324a' },
      { label: 'Pending', value: 38, dot: '#d0891f' },
    ],
  },
  {
    id: 'oct-22',
    label: '22 Oct 2026 – 22 Oct 2026',
    chip: '22 Oct 2026',
    reportId: 'PLT-2026-OCT-22',
    clients: [
      { label: 'New in range', value: 1, dot: '#1f8a4c' },
      { label: 'Active now', value: 24, dot: '#1f8a4c' },
      { label: 'Suspended now', value: 2, dot: '#8a847c' },
    ],
    subscriptions: [
      { label: 'Trialing', value: 6, dot: '#d0891f' },
      { label: 'Active', value: 15, dot: '#1f8a4c' },
      { label: 'Past due', value: 3, dot: '#d92d20' },
      { label: 'Cancelled', value: 2, dot: '#8a847c' },
      { label: 'Expired', value: 0, dot: '#8a847c' },
    ],
    bookings: [
      { label: 'Total', value: 148, dot: '#1c1c1c' },
      { label: 'Seated', value: 52, dot: '#1f8a4c' },
      { label: 'Completed', value: 61, dot: '#8a847c' },
      { label: 'Cancelled', value: 18, dot: '#d92d20' },
      { label: 'No-show', value: 6, dot: '#24324a' },
      { label: 'Pending', value: 11, dot: '#d0891f' },
    ],
  },
];

const pills: { id: Exclude<ReportView, 'custom'>; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'empty', label: 'Empty' },
  { id: 'loading', label: 'Loading' },
];

const rangeBounds: Record<string, { from: string; to: string }> = {
  'oct-15-22': { from: new Date('2026-10-15T00:00:00+05:30').toISOString(), to: new Date('2026-10-23T00:00:00+05:30').toISOString() },
  'oct-01-22': { from: new Date('2026-10-01T00:00:00+05:30').toISOString(), to: new Date('2026-10-23T00:00:00+05:30').toISOString() },
  'oct-22': { from: new Date('2026-10-22T00:00:00+05:30').toISOString(), to: new Date('2026-10-23T00:00:00+05:30').toISOString() },
};

type ApiPlatformReport = {
  clients: { newInRange: number; active: number; suspended: number };
  subscriptions: Record<string, number>;
  bookings: Record<string, number>;
};

function applyReport(preset: ReportSnapshot, data: ApiPlatformReport): ReportSnapshot {
  const dot = (label: string) => preset.clients.find((item) => item.label === label)?.dot ?? preset.subscriptions.find((item) => item.label === label)?.dot ?? preset.bookings.find((item) => item.label === label)?.dot ?? '#8a847c';
  return {
    ...preset,
    clients: [
      { label: 'New in range', value: data.clients.newInRange, dot: dot('New in range') },
      { label: 'Active now', value: data.clients.active, dot: dot('Active now') },
      { label: 'Suspended now', value: data.clients.suspended, dot: dot('Suspended now') },
    ],
    subscriptions: [
      { label: 'Trialing', value: data.subscriptions.TRIALING ?? 0, dot: dot('Trialing') },
      { label: 'Active', value: data.subscriptions.ACTIVE ?? 0, dot: dot('Active') },
      { label: 'Past due', value: data.subscriptions.PAST_DUE ?? 0, dot: dot('Past due') },
      { label: 'Cancelled', value: data.subscriptions.CANCELLED ?? 0, dot: dot('Cancelled') },
      { label: 'Expired', value: data.subscriptions.EXPIRED ?? 0, dot: dot('Expired') },
    ],
    bookings: [
      { label: 'Total', value: data.bookings.total ?? 0, dot: dot('Total') },
      { label: 'Seated', value: data.bookings.SEATED ?? 0, dot: dot('Seated') },
      { label: 'Completed', value: data.bookings.COMPLETED ?? 0, dot: dot('Completed') },
      { label: 'Cancelled', value: data.bookings.CANCELLED ?? 0, dot: dot('Cancelled') },
      { label: 'No-show', value: data.bookings.NO_SHOW ?? 0, dot: dot('No-show') },
      { label: 'Pending', value: (data.bookings.PENDING ?? 0) + (data.bookings.CONFIRMED ?? 0), dot: dot('Pending') },
    ],
  };
}

const defaultRange = ranges[0];

type PlatformReportsPageProps = {
  onSignOut: () => void;
  onNavigate: (section: PlatformSection) => void;
};

export function PlatformReportsPage({ onSignOut, onNavigate }: PlatformReportsPageProps) {
  const [view, setView] = useState<ReportView>('default');
  const [draftId, setDraftId] = useState(defaultRange.id);
  const [appliedId, setAppliedId] = useState(defaultRange.id);
  const [live, setLive] = useState<ReportSnapshot | null>(null);

  useEffect(() => {
    document.title = 'DinePoint Platform · Reports';
    loadReport(defaultRange.id);
  }, []);

  function loadReport(id: string) {
    const bounds = rangeBounds[id];
    if (!bounds) return;
    const query = `from=${encodeURIComponent(bounds.from)}&to=${encodeURIComponent(bounds.to)}`;
    api<ApiPlatformReport>(`/platform/reports?${query}`)
      .then((data) => {
        const preset = ranges.find((range) => range.id === id) ?? defaultRange;
        setLive(applyReport(preset, data));
      })
      .catch(() => undefined);
  }

  const busy = view === 'loading';
  const applied = (view === 'default' || view === 'custom' ? live : null) ?? ranges.find((range) => range.id === appliedId) ?? defaultRange;
  const report = view === 'empty' ? zeroed(applied) : applied;

  function show(next: Exclude<ReportView, 'custom'>) {
    setDraftId(defaultRange.id);
    setAppliedId(defaultRange.id);
    setView(next);
  }

  function applyRange() {
    setAppliedId(draftId);
    setView(draftId === defaultRange.id ? 'default' : 'custom');
    loadReport(draftId);
  }

  function exportCsv() {
    const bounds = rangeBounds[appliedId];
    if (bounds && live) {
      const query = `from=${encodeURIComponent(bounds.from)}&to=${encodeURIComponent(bounds.to)}`;
      void apiText(`/platform/reports/export?${query}`).then((csv) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dinepoint-report-${report.reportId}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      });
      return;
    }
    const rows = [
      ['Report ID', report.reportId],
      ['Range', report.label],
      ['Section', 'Metric', 'Value'],
      ...report.clients.map((item) => ['Clients', item.label, String(item.value)]),
      ...report.subscriptions.map((item) => ['Subscriptions', item.label, String(item.value)]),
      ...report.bookings.map((item) => ['Bookings', item.label, String(item.value)]),
    ];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dinepoint-report-${report.reportId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PlatformShell active="reports" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="platform-page">
        <div className="inspect-bar floors-inspect">
          <span className="inspect-label">State demo:</span>
          <div role="group" aria-label="Inspect state">
            {pills.map((item) => (
              <button key={item.id} type="button" className={view === item.id ? 'state-pill is-active' : 'state-pill'} aria-pressed={view === item.id} onClick={() => show(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <p className="plt-health">
          <span>
            <i aria-hidden="true" />
            Cluster Live: AP-South-1 (Mumbai)
          </span>
          <span>Active Sync: Real-time (99.98% Uptime)</span>
          <span>Database Lag: 12ms</span>
        </p>
        <p className="plt-scope">All clients</p>

        <form
          className="plt-toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) applyRange();
          }}
        >
          <div className="plt-toolbar-start">
            <label className="plt-range">
              <CalendarIcon />
              <span className="visually-hidden">Date range</span>
              <select value={draftId} disabled={busy} onChange={(event) => setDraftId(event.target.value)}>
                {ranges.map((range) => (
                  <option key={range.id} value={range.id}>
                    {range.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="plt-reset" type="button" disabled={busy} onClick={() => show('default')}>
              Reset
            </button>
            <button className="plt-apply" type="submit" disabled={busy}>
              Apply
            </button>
          </div>
          <button className="plt-export" type="button" disabled={busy} onClick={exportCsv}>
            <DownloadIcon />
            Export CSV
          </button>
        </form>

        {busy ? (
          <div className="today-loading" role="status" aria-live="polite">
            <p>Loading report…</p>
            <span className="skeleton-row" />
            <span className="skeleton-row" />
            <span className="skeleton-row" />
          </div>
        ) : (
          <>
            <section className="plt-panel" aria-labelledby="report-clients">
              <header>
                <h2 id="report-clients">
                  Clients <span>Snapshot & window activity</span>
                </h2>
                <p className="plt-kicker">Entity metrics</p>
              </header>
              <div className="plt-metrics is-clients">
                {report.clients.map((item) => (
                  <Metric key={item.label} item={item} />
                ))}
              </div>
            </section>

            <section className="plt-panel" aria-labelledby="report-subscriptions">
              <header>
                <h2 id="report-subscriptions">
                  Subscriptions now <span>Current snapshot</span>
                </h2>
                <p className="plt-badge">Live Billing State</p>
              </header>
              <div className="plt-metrics is-subs">
                {report.subscriptions.map((item) => (
                  <Metric key={item.label} item={item} />
                ))}
              </div>
            </section>

            <section className="plt-panel" aria-labelledby="report-bookings">
              <header>
                <h2 id="report-bookings">
                  Bookings in range <span className="plt-chip">{report.chip}</span>
                </h2>
                <p className="plt-kicker">Aggregate throughput</p>
              </header>
              <div className="plt-metrics is-bookings">
                {report.bookings.map((item) => (
                  <Metric key={item.label} item={item} />
                ))}
              </div>
            </section>

            <div className="plt-note">
              <InfoIcon />
              <div>
                <p>Client and subscription counts are the current snapshot. Bookings use the selected dates.</p>
                <p>Report ID {report.reportId}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </PlatformShell>
  );
}

function Metric({ item }: { item: { label: string; value: number; dot: string } }) {
  return (
    <article className="plt-metric">
      <p>
        <i style={{ background: item.dot }} aria-hidden="true" />
        {item.label}
      </p>
      <strong>{item.value.toLocaleString('en-IN')}</strong>
    </article>
  );
}

function zeroed(report: ReportSnapshot): ReportSnapshot {
  const clear = (items: ReportSnapshot['clients']) => items.map((item) => ({ ...item, value: 0 }));
  return {
    ...report,
    clients: clear(report.clients),
    subscriptions: clear(report.subscriptions),
    bookings: clear(report.bookings),
  };
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3.5v3M16 3.5v3M4 10h16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M12 4v10M8 10l4 4 4-4M6 19h12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 11v5M12 8h.01" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
