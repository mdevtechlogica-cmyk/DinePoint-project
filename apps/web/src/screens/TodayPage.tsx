import { useEffect, useState } from 'react';
import { api, formatTime, kolkataDayRange } from '../api';
import { AdminShell, type AdminSection } from '../components/AdminShell';
import { readSession } from '../session';

type BookingStatus = 'Pending' | 'Seated' | 'Completed' | 'Cancelled' | 'No-show';
type StatusFilter = 'All' | BookingStatus;
type TodayView = 'all' | 'seated' | 'empty' | 'loading';

export type Booking = {
  id: string;
  time: string;
  guest: string;
  phone: string;
  party: number;
  floor: string;
  room: string;
  table: number;
  status: BookingStatus;
};

export const bookings: Booking[] = [
  { id: '1', time: '11:20 AM', guest: 'Vinod Kumar', phone: '99610 87654', party: 2, floor: 'Ground', room: 'AC Hall', table: 1, status: 'No-show' },
  { id: '2', time: '11:45 AM', guest: 'Deepa Krishnan', phone: '90370 22145', party: 5, floor: 'First', room: 'Family Room', table: 10, status: 'Completed' },
  { id: '3', time: '12:05 PM', guest: 'Mariam Thomas', phone: '94960 11890', party: 4, floor: 'First', room: 'Family Room', table: 11, status: 'Cancelled' },
  { id: '4', time: '12:40 PM', guest: 'Ananya Nair', phone: '98470 11223', party: 4, floor: 'Ground', room: 'AC Hall', table: 4, status: 'Seated' },
  { id: '5', time: '12:55 PM', guest: 'Rahul Menon', phone: '98950 44218', party: 2, floor: 'Ground', room: 'AC Hall', table: 2, status: 'Seated' },
  { id: '6', time: '1:10 PM', guest: 'Fathima Basheer', phone: '94470 56781', party: 6, floor: 'First', room: 'Family Room', table: 9, status: 'Pending' },
  { id: '7', time: '1:30 PM', guest: 'Joseph Mathew', phone: '97460 33210', party: 3, floor: 'Ground', room: 'AC Hall', table: 6, status: 'Pending' },
];

const views: { id: TodayView; label: string }[] = [
  { id: 'all', label: '1. Default (All 7)' },
  { id: 'seated', label: '2. Filtered: Seated (2)' },
  { id: 'empty', label: '3. Empty State' },
  { id: 'loading', label: '4. Loading State' },
];

const statuses: BookingStatus[] = ['Pending', 'Seated', 'Completed', 'Cancelled', 'No-show'];

type TodayPageProps = {
  onSignOut: () => void;
  onNavigate: (section: AdminSection) => void;
  onNewBooking: () => void;
  onOpenBooking: (bookingId: string) => void;
};

export function TodayPage({ onSignOut, onNavigate, onNewBooking, onOpenBooking }: TodayPageProps) {
  const [view, setView] = useState<TodayView>('all');
  const [filter, setFilter] = useState<StatusFilter>('All');
  const [rows, setRows] = useState<Booking[]>([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const session = readSession();
    if (!session?.organizationId || !session.restaurantId) {
      setRows([]);
      setNotice(session?.organizationId ? 'Select a restaurant from the Restaurant page.' : '');
      return;
    }
    const range = kolkataDayRange();
    const path = `/organizations/${session.organizationId}/restaurants/${session.restaurantId}/reservations?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`;
    api<ApiReservation[]>(path)
      .then((list) => {
        setRows(list.map(toBooking));
        setNotice('');
      })
      .catch(() => {
        setRows([]);
        setNotice('Bookings could not be loaded.');
      });
  }, []);

  function selectView(next: TodayView) {
    setView(next);
    setFilter(next === 'seated' ? 'Seated' : 'All');
  }

  function selectFilter(next: StatusFilter) {
    if (view === 'loading' || view === 'empty') {
      return;
    }

    setFilter(next);
    setView(next === 'Seated' ? 'seated' : 'all');
  }

  const source = view === 'empty' ? [] : rows;
  const visible = source.filter((booking) => filter === 'All' || booking.status === filter);
  const counts = countStatuses(source);

  return (
    <AdminShell active="today" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="inspect-bar">
        <span>Inspect state</span>
        <div role="group" aria-label="Inspect state">
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'state-pill is-active' : 'state-pill'}
              aria-pressed={view === item.id}
              onClick={() => selectView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="today-page" aria-labelledby="today-title">
        <div className="today-heading">
          <div>
            <h1 id="today-title">Today&apos;s bookings</h1>
            <p>{view === 'loading' ? 'Loading bookings' : notice || `${visible.length} bookings`}</p>
          </div>
          <button className="sign-in-button today-action" type="button" onClick={onNewBooking}>
            + New spot booking
          </button>
        </div>

        <div className="status-filters" role="group" aria-label="Filter by status">
          <FilterChip
            label="All"
            count={counts.All}
            pressed={filter === 'All'}
            disabled={view === 'loading' || view === 'empty'}
            onClick={() => selectFilter('All')}
          />
          {statuses.map((status) => (
            <FilterChip
              key={status}
              label={status}
              count={counts[status]}
              pressed={filter === status}
              disabled={view === 'loading' || view === 'empty'}
              onClick={() => selectFilter(status)}
            />
          ))}
        </div>

        {view === 'loading' ? <LoadingTable /> : null}
        {view === 'empty' ? <EmptyBookings /> : null}
        {view !== 'loading' && view !== 'empty' ? (
          <BookingTable bookings={visible} onOpen={onOpenBooking} />
        ) : null}

        <footer className="today-meta">
          <p>
            <span className="status-dot" aria-hidden="true" />
            Active floor capacity: {view === 'empty' ? '0' : '18'} / 32 tables
          </p>
          <p>Turnaround avg: {view === 'empty' ? '—' : '48 mins'}</p>
          <p>Auto-sync POS: {view === 'loading' ? 'Syncing…' : 'Connected (0.4s)'}</p>
          <p className="key-hints">
            <kbd>N</kbd> New booking <kbd>F</kbd> Search / filter
          </p>
        </footer>
      </section>
    </AdminShell>
  );
}

function FilterChip({
  label,
  count,
  pressed,
  disabled,
  onClick,
}: {
  label: string;
  count: number;
  pressed: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={pressed ? 'filter-chip is-active' : 'filter-chip'}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      {label} <span>{count}</span>
    </button>
  );
}

function BookingTable({ bookings: rows, onOpen }: { bookings: Booking[]; onOpen: (bookingId: string) => void }) {
  return (
    <div className="booking-table-wrap">
      <table className="booking-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Guest name</th>
            <th>Phone</th>
            <th>Party</th>
            <th>Floor</th>
            <th>Room</th>
            <th>Table</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((booking) => (
            <tr key={booking.id}>
              <td>{booking.time}</td>
              <td>{booking.guest}</td>
              <td>{booking.phone}</td>
              <td>{booking.party}</td>
              <td>{booking.floor}</td>
              <td>{booking.room}</td>
              <td>
                <span className={booking.status === 'Seated' ? 'table-badge is-seated' : 'table-badge'}>
                  {booking.table}
                </span>
              </td>
              <td>
                <span className={`status-badge status-${booking.status.toLowerCase().replace('-', '')}`}>
                  {booking.status}
                </span>
              </td>
              <td>
                <button className="row-open" type="button" aria-label={`Open booking for ${booking.guest}`} onClick={() => onOpen(booking.id)}>
                  ›
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ApiReservation = {
  id: string;
  guestName: string;
  guestPhone: string;
  guestCount: number;
  status: string;
  startsAt: string;
  tables: { table: { tableNumber: number; floor: { name: string } | null; room: { name: string } | null } }[];
};

const statusLabels: Record<string, BookingStatus> = {
  PENDING: 'Pending',
  CONFIRMED: 'Pending',
  SEATED: 'Seated',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REJECTED: 'Cancelled',
  NO_SHOW: 'No-show',
};

function toBooking(reservation: ApiReservation): Booking {
  const table = reservation.tables[0]?.table;
  return {
    id: reservation.id,
    time: formatTime(reservation.startsAt),
    guest: reservation.guestName,
    phone: reservation.guestPhone,
    party: reservation.guestCount,
    floor: table?.floor?.name ?? '—',
    room: table?.room?.name ?? '—',
    table: table?.tableNumber ?? 0,
    status: statusLabels[reservation.status] ?? 'Pending',
  };
}

function EmptyBookings() {
  return (
    <div className="today-empty">
      <h2>No bookings today</h2>
      <p>Spot bookings you take at the restaurant will show up here.</p>
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="today-loading" role="status" aria-live="polite">
      <p>Loading today’s bookings…</p>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="skeleton-row" />
      ))}
    </div>
  );
}

function countStatuses(rows: Booking[]) {
  const counts: Record<StatusFilter, number> = {
    All: rows.length,
    Pending: 0,
    Seated: 0,
    Completed: 0,
    Cancelled: 0,
    'No-show': 0,
  };

  for (const row of rows) {
    counts[row.status] += 1;
  }

  return counts;
}
