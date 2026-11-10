import { useEffect, useState } from 'react';
import { api, formatWhen } from '../api';
import { AdminShell, type AdminSection } from '../components/AdminShell';
import { readSession } from '../session';

type ReportView = 'default' | 'cancelled' | 'range' | 'empty' | 'loading' | 'custom';
type Status = 'Seated' | 'Completed' | 'Cancelled' | 'No-show' | 'Pending';

type ReportRow = {
  id: string;
  when: string;
  guest: string;
  phone: string;
  party: number;
  floor: string;
  room: string;
  table: number;
  status: Status;
  staff: string;
};

const showcase: ReportRow[] = [
  { id: 'r1', when: '22 Oct, 12:40 PM', guest: 'Ananya Nair', phone: '+91 98470 11223', party: 4, floor: 'Ground', room: 'AC Hall', table: 4, status: 'Seated', staff: 'Rahul Menon' },
  { id: 'r2', when: '22 Oct, 11:45 AM', guest: 'Deepa Krishnan', phone: '+91 90370 22145', party: 5, floor: 'First', room: 'Family Room', table: 10, status: 'Completed', staff: 'Latha Menon' },
  { id: 'r3', when: '21 Oct, 8:15 PM', guest: 'Joseph Mathew', phone: '+91 97460 33210', party: 3, floor: 'Ground', room: 'AC Hall', table: 6, status: 'Completed', staff: 'Rahul Menon' },
  { id: 'r4', when: '21 Oct, 7:30 PM', guest: 'Mariam Thomas', phone: '+91 94960 11890', party: 4, floor: 'First', room: 'Family Room', table: 11, status: 'Cancelled', staff: 'Nisha Joseph' },
  { id: 'r5', when: '20 Oct, 1:05 PM', guest: 'Vinod Kumar', phone: '+91 99610 87654', party: 2, floor: 'Ground', room: 'AC Hall', table: 1, status: 'No-show', staff: 'Rahul Menon' },
];

const cancelledOnly: ReportRow[] = [
  { id: 'c2', when: '19 Oct, 8:40 PM', guest: 'Meera Nair', phone: '+91 98470 22019', party: 2, floor: 'Ground', room: 'AC Hall', table: 3, status: 'Cancelled', staff: 'Suresh Pillai' },
  { id: 'c3', when: '18 Oct, 6:20 PM', guest: 'Arun Das', phone: '+91 90370 44112', party: 3, floor: 'First', room: 'Family Room', table: 8, status: 'Cancelled', staff: 'Latha Menon' },
];

const defaultTotals = { total: 148, seated: 52, completed: 79, cancelled: 11, noshow: 6 };

const views: { id: ReportView; label: string }[] = [
  { id: 'default', label: '1. Default (148)' },
  { id: 'cancelled', label: '2. Filtered: Cancelled' },
  { id: 'range', label: '3. Date Range' },
  { id: 'empty', label: '4. No Results' },
  { id: 'loading', label: '5. Loading' },
];

type ReportsPageProps = {
  onSignOut: () => void;
  onNavigate: (section: AdminSection) => void;
};

export function ReportsPage({ onSignOut, onNavigate }: ReportsPageProps) {
  const [view, setView] = useState<ReportView>('default');
  const [status, setStatus] = useState('All statuses');
  const [floor, setFloor] = useState('All floors');
  const [room, setRoom] = useState('All rooms');
  const [staff, setStaff] = useState('All employees');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [applied, setApplied] = useState(false);
  const [live, setLive] = useState<ReportRow[] | null>(null);
  const [apiTotals, setApiTotals] = useState(defaultTotals);
  const [rangeLabel, setRangeLabel] = useState('15 Oct 2026 – 22 Oct 2026');

  useEffect(() => {
    const session = readSession();
    if (!session?.organizationId || !session.restaurantId) return;
    const to = new Date();
    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    setRangeLabel(`${formatWhen(from, false)} – ${formatWhen(to, false)}`);
    const path = `/organizations/${session.organizationId}/restaurants/${session.restaurantId}/reservations/report?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&pageSize=100`;
    api<ApiReport>(path)
      .then((report) => {
        setLive(report.rows.map(toReportRow));
        setApiTotals({
          total: report.totals.total,
          seated: report.totals.seated,
          completed: report.totals.completed,
          cancelled: report.totals.cancelled,
          noshow: report.totals.noShow,
        });
      })
      .catch(() => setLive([]));
  }, []);

  const busy = view === 'loading';
  const sample = view === 'cancelled' ? [...showcase, ...cancelledOnly] : showcase;
  const source = live && view !== 'cancelled' ? live : live && view === 'cancelled' ? live.filter((row) => row.status === 'Cancelled') : sample;
  const filtered = source.filter((row) => {
    if (view === 'empty' || view === 'loading') return false;
    if (view === 'cancelled') return row.status === 'Cancelled';
    if ((view === 'default' || view === 'range') && !applied) return true;
    return (
      (status === 'All statuses' || row.status === status) &&
      (floor === 'All floors' || row.floor === floor) &&
      (room === 'All rooms' || row.room === room) &&
      (staff === 'All employees' || row.staff === staff)
    );
  });

  const presetTotals = live ? false : (view === 'default' || view === 'range') && !applied;
  const total = presetTotals ? defaultTotals.total : filtered.length;
  const pageCount = Math.max(1, presetTotals ? Math.ceil(defaultTotals.total / pageSize) : Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const directSlice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageRows =
    directSlice.length > 0 || filtered.length === 0
      ? directSlice
      : filtered.slice(((safePage - 1) * pageSize) % filtered.length, (((safePage - 1) * pageSize) % filtered.length) + pageSize);
  const start = pageRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = pageRows.length === 0 ? 0 : Math.min(total, start + pageRows.length - 1);
  const totals = live && !applied
    ? apiTotals
    : presetTotals
    ? defaultTotals
    : {
          total: filtered.length,
          seated: filtered.filter((row) => row.status === 'Seated').length,
          completed: filtered.filter((row) => row.status === 'Completed').length,
          cancelled: filtered.filter((row) => row.status === 'Cancelled').length,
          noshow: filtered.filter((row) => row.status === 'No-show').length,
        };

  function show(next: ReportView) {
    setView(next);
    setPage(1);
    setApplied(false);
    setPageSize(25);
    setStatus(next === 'cancelled' ? 'Cancelled' : 'All statuses');
    setFloor(next === 'empty' ? 'Terrace' : 'All floors');
    setRoom('All rooms');
    setStaff('All employees');
  }

  function applyFilters() {
    if (busy) return;
    setPage(1);
    const untouched = status === 'All statuses' && floor === 'All floors' && room === 'All rooms' && staff === 'All employees';
    if (untouched) {
      setApplied(false);
      setView('default');
      return;
    }
    setApplied(true);
    const next = showcase.filter(
      (row) =>
        (status === 'All statuses' || row.status === status) &&
        (floor === 'All floors' || row.floor === floor) &&
        (room === 'All rooms' || row.room === room) &&
        (staff === 'All employees' || row.staff === staff),
    );
    const cancelledPreset = status === 'Cancelled' && floor === 'All floors' && room === 'All rooms' && staff === 'All employees';
    setView(next.length === 0 ? 'empty' : cancelledPreset ? 'cancelled' : 'custom');
  }

  function exportCsv() {
    const header = ['Date and time', 'Guest name', 'Phone', 'Party size', 'Floor', 'Room', 'Table', 'Status'];
    const lines = [header, ...pageRows.map((row) => [row.when, row.guest, row.phone, String(row.party), row.floor, row.room, `Table ${row.table}`, row.status])];
    const csv = lines.map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'saffron-house-booking-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell active="reports" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="inspect-bar floors-inspect">
        <span className="inspect-label">State demo:</span>
        <div role="group" aria-label="Inspect state">
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'state-pill is-active' : 'state-pill'}
              aria-pressed={view === item.id}
              onClick={() => show(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="inspect-build">BOH operational mode active</p>
      </div>

      <section className="today-page" aria-labelledby="reports-title">
        <div className="today-heading">
          <div>
            <h1 id="reports-title">Booking reports</h1>
            <p>{readSession()?.restaurantName ?? 'Saffron House'}, {live ? rangeLabel.replace(' – ', ' to ') : '15 Oct 2026 to 22 Oct 2026'}</p>
          </div>
          <button className="edit-button export-button" type="button" onClick={exportCsv} disabled={busy || pageRows.length === 0}>
            Export CSV
          </button>
        </div>

        <form
          className="report-filters"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <label className="field">
            Date range
            <input className={view === 'range' ? 'is-preview-focus' : ''} value={live ? rangeLabel : '15 Oct 2026 – 22 Oct 2026'} readOnly />
          </label>
          <Select label="Status" value={status} disabled={busy} onChange={setStatus} options={['All statuses', 'Seated', 'Completed', 'Cancelled', 'No-show', 'Pending']} />
          <Select label="Floor" value={floor} disabled={busy} onChange={setFloor} options={live ? ['All floors', ...new Set(live.map((row) => row.floor).filter(Boolean))] : ['All floors', 'Ground', 'First', 'Terrace']} />
          <Select label="Room" value={room} disabled={busy} onChange={setRoom} options={live ? ['All rooms', ...new Set(live.map((row) => row.room).filter(Boolean))] : ['All rooms', 'AC Hall', 'Family Room', 'Private Dining']} />
          <Select label="Staff member" value={staff} disabled={busy} onChange={setStaff} options={live ? ['All employees', ...new Set(live.map((row) => row.staff).filter((name) => name && name !== '—'))] : ['All employees', 'Suresh Pillai', 'Latha Menon', 'Rahul Menon', 'Nisha Joseph']} />
          <div className="report-filter-actions">
            <p>{view === 'range' ? 'Custom range applied: 15 Oct 2026 – 22 Oct 2026' : 'Standard active period: Last 7 days'}</p>
            <button className="text-action" type="button" onClick={() => show('default')} disabled={busy}>
              Reset
            </button>
            <button className="sign-in-button today-action" type="submit" disabled={busy}>
              Apply filters
            </button>
          </div>
        </form>

        {busy ? (
          <div className="today-loading" role="status" aria-live="polite">
            <p>Loading booking report…</p>
            <span className="skeleton-row" />
            <span className="skeleton-row" />
            <span className="skeleton-row" />
          </div>
        ) : (
          <>
            <div className="report-stats">
              <Stat label="Total" value={totals.total} note="Confirmed orders" dot="#8a847c" />
              <Stat label="Seated" value={totals.seated} note="Currently dining" dot="#1f8a4c" />
              <Stat label="Completed" value={totals.completed} note="Billed and settled" dot="#3f3c37" />
              <Stat label="Cancelled" value={totals.cancelled} note="Prior to arrival" dot="#d92d20" />
              <Stat label="No-show" value={totals.noshow} note="Expired reservation" dot="#6941c6" />
            </div>

            {pageRows.length === 0 ? (
              <div className="today-empty">
                <h2>No bookings found</h2>
                <p>No bookings match this date range and these filters.</p>
              </div>
            ) : (
              <div className="booking-table-wrap">
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th>Date and time</th>
                      <th>Guest name</th>
                      <th>Phone</th>
                      <th>Party size</th>
                      <th>Floor</th>
                      <th>Room</th>
                      <th>Table</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={`${row.id}-${safePage}`}>
                        <td>{row.when}</td>
                        <td>{row.guest}</td>
                        <td>{row.phone}</td>
                        <td>{row.party} guests</td>
                        <td>{row.floor}</td>
                        <td>{row.room}</td>
                        <td>Table {row.table}</td>
                        <td>
                          <span className={`status-badge status-${row.status.toLowerCase().replace('-', '')}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="report-pager">
                  <p>
                    Showing {start}–{end} of {total} bookings
                  </p>
                  <label>
                    Rows
                    <select
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setPage(1);
                      }}
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                    </select>
                  </label>
                  <div role="group" aria-label="Pages">
                    <button type="button" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page">
                      ‹
                    </button>
                    {(pageCount > 4 ? [1, 2, 3] : Array.from({ length: pageCount }, (_, index) => index + 1)).map((item) => (
                      <button key={item} type="button" className={safePage === item ? 'is-current' : ''} onClick={() => setPage(item)}>
                        {item}
                      </button>
                    ))}
                    {pageCount > 4 ? (
                      <>
                        <span>…</span>
                        <button type="button" className={safePage === pageCount ? 'is-current' : ''} onClick={() => setPage(pageCount)}>
                          {pageCount}
                        </button>
                      </>
                    ) : null}
                    <button type="button" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)} aria-label="Next page">
                      ›
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="rooms-sync">
          <p>Historical cancellations and no-show metrics synchronize automatically with guest contact logs for the Fort Nagar branch.</p>
          <p>Report ID: RPT-2026-OCT-22B</p>
        </div>
      </section>
    </AdminShell>
  );
}

type ApiReport = {
  totals: { total: number; seated: number; completed: number; cancelled: number; noShow: number };
  rows: {
    id: string;
    startsAt: string;
    guestName: string;
    guestPhone: string;
    guestCount: number;
    status: string;
    floor: { name: string } | null;
    room: { name: string } | null;
    table: { tableNumber: number } | null;
    staff: { name: string } | null;
  }[];
};

const reportStatus: Record<string, Status> = {
  PENDING: 'Pending',
  CONFIRMED: 'Pending',
  SEATED: 'Seated',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REJECTED: 'Cancelled',
  NO_SHOW: 'No-show',
};

function toReportRow(row: ApiReport['rows'][number]): ReportRow {
  return {
    id: row.id,
    when: formatWhen(row.startsAt),
    guest: row.guestName,
    phone: row.guestPhone,
    party: row.guestCount,
    floor: row.floor?.name ?? '—',
    room: row.room?.name ?? '—',
    table: row.table?.tableNumber ?? 0,
    status: reportStatus[row.status] ?? 'Pending',
    staff: row.staff?.name ?? '—',
  };
}

function Select({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      {label}
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Stat({ label, value, note, dot }: { label: string; value: number; note: string; dot: string }) {
  return (
    <article className="report-stat">
      <p>
        {label}
        <i style={{ background: dot }} />
      </p>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  );
}
