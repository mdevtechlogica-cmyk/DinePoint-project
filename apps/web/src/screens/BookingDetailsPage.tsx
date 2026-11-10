import { useEffect, useState } from 'react';
import { api } from '../api';
import { AdminShell, type AdminSection } from '../components/AdminShell';
import { readSession } from '../session';
import { bookings, type Booking } from './TodayPage';

type BookingStatus = Booking['status'];
type DetailView = 'record' | 'seated' | 'pending' | 'completed' | 'cancel' | 'noshow' | 'saved' | 'loading';

const views: { id: Exclude<DetailView, 'record'>; label: string }[] = [
  { id: 'seated', label: '1. Seated (Default)' },
  { id: 'pending', label: '2. Pending' },
  { id: 'completed', label: '3. Completed' },
  { id: 'cancel', label: '4. Cancel Dialog' },
  { id: 'noshow', label: '5. No-show Dialog' },
  { id: 'saved', label: '6. Saved Toast' },
  { id: 'loading', label: '7. Loading State' },
];

type ApiReservation = {
  id: string;
  guestName: string;
  guestPhone: string;
  guestCount: number;
  status: string;
  startsAt: string;
  specialRequests: string | null;
  tables: { table: { tableNumber: number; floor: { name: string } | null; room: { name: string } | null } }[];
};

const notes: Record<string, string> = {
  '4': 'Birthday celebration, needs a cake table. Customer requested silent cake presentation at 1:15 PM.',
};

type BookingDetailsPageProps = {
  bookingId: string;
  onBack: () => void;
  onSignOut: () => void;
  onNavigate: (section: AdminSection) => void;
};

export function BookingDetailsPage({ bookingId, onBack, onSignOut, onNavigate }: BookingDetailsPageProps) {
  const sample = bookings.find((item) => item.id === bookingId) ?? bookings[0];
  const [booking, setBooking] = useState(sample);
  const [view, setView] = useState<DetailView>(initialView(sample.status));
  const [status, setStatus] = useState<BookingStatus>(sample.status);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);
  const [reservationNote, setReservationNote] = useState('');

  const dialog = view === 'cancel' || view === 'noshow';
  const loading = view === 'loading';
  const floorArea = `${booking.floor.endsWith('Floor') ? booking.floor : `${booking.floor} Floor`} · ${booking.room}`;
  useEffect(() => {
    const session = readSession();
    if (!session?.organizationId || !session.restaurantId || bookingId.length < 12) return;
    api<ApiReservation>(
      `/organizations/${session.organizationId}/restaurants/${session.restaurantId}/reservations/${bookingId}`,
    )
      .then((reservation) => {
        const table = reservation.tables[0]?.table;
        const labels: Record<string, BookingStatus> = {
          PENDING: 'Pending',
          CONFIRMED: 'Pending',
          SEATED: 'Seated',
          COMPLETED: 'Completed',
          CANCELLED: 'Cancelled',
          NO_SHOW: 'No-show',
        };
        const next: Booking = {
          id: reservation.id,
          time: new Date(reservation.startsAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
          guest: reservation.guestName,
          phone: reservation.guestPhone,
          party: reservation.guestCount,
          floor: table?.floor?.name ?? '—',
          room: table?.room?.name ?? '—',
          table: table?.tableNumber ?? 0,
          status: labels[reservation.status] ?? 'Pending',
        };
        setBooking(next);
        setStatus(next.status);
        setReservationNote(reservation.specialRequests ?? '');
        setView(initialView(next.status));
      })
      .catch(() => undefined);
  }, [bookingId]);

  const note = reservationNote || notes[booking.id] || 'No special instructions.';
  const reference = booking.id === '4' ? 'DP-BLR-2026-88412' : `DP-BLR-2026-8841${booking.id}`;

  function show(next: DetailView) {
    if (next === 'pending') setStatus('Pending');
    else if (next === 'completed') setStatus('Completed');
    else if (next === 'seated' || next === 'cancel' || next === 'noshow' || next === 'saved') setStatus('Seated');
    setToast(next === 'saved' ? 'Booking details saved.' : '');
    setCopied(false);
    setView(next);
  }

  function closeDialog() {
    if (status === 'Pending') setView('pending');
    else if (status === 'Completed') setView('completed');
    else if (status === 'Seated') setView('seated');
    else setView('record');
  }

  function finish(nextStatus: BookingStatus, message: string) {
    const session = readSession();
    const apiStatus = { Seated: 'SEATED', Completed: 'COMPLETED', Cancelled: 'CANCELLED', 'No-show': 'NO_SHOW', Pending: 'PENDING' }[nextStatus];
    if (session?.organizationId && session.restaurantId && booking.id.length > 12) {
      void api(`/organizations/${session.organizationId}/restaurants/${session.restaurantId}/reservations/${booking.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: apiStatus }),
      }).then(() => {
        setStatus(nextStatus);
        setToast(message);
        setView('saved');
      });
      return;
    }
    setStatus(nextStatus);
    setToast(message);
    setView('saved');
  }

  const canSeat = status === 'Pending' && !loading && !dialog;
  const canComplete = status === 'Seated' && !loading && !dialog;
  const canCancel = (status === 'Pending' || status === 'Seated') && !loading && !dialog;
  const canNoShow = status === 'Pending' && !loading && !dialog;

  return (
    <AdminShell active="today" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="inspect-bar floors-inspect">
        <span className="inspect-label">Demo scenarios:</span>
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
      </div>

      <section className="today-page" aria-labelledby="booking-title">
        <p className="crumb">
          <button type="button" onClick={onBack}>
            Today
          </button>
          <span aria-hidden="true">&gt;</span>
          {booking.guest}
        </p>
        <div className="today-heading">
          <div className="rooms-heading">
            <button className="back-button" type="button" aria-label="Back to today" onClick={onBack}>
              ←
            </button>
            <h1 id="booking-title">
              Booking details
              <span className={`status-badge status-${statusClass(status)}`}>{status}</span>
            </h1>
          </div>
          <p className="table-chip">
            Table {booking.table} · {floorArea}
            {status === 'Seated' ? <span className="status-dot" aria-hidden="true" /> : null}
          </p>
        </div>

        {view === 'saved' ? <p className="save-toast">{toast}</p> : null}

        {loading ? (
          <div className="today-loading" role="status" aria-live="polite">
            <p>Loading booking details…</p>
            <span className="skeleton-row" />
            <span className="skeleton-row" />
            <span className="skeleton-row" />
          </div>
        ) : (
          <>
            <div className="spot-card booking-facts">
              <dl>
                <div>
                  <dt>Guest name</dt>
                  <dd>{booking.guest}</dd>
                </div>
                <div>
                  <dt>Phone number</dt>
                  <dd className="phone-actions">
                    +91 {booking.phone}
                    <button
                      type="button"
                      aria-label={copied ? 'Phone number copied' : 'Copy phone number'}
                      onClick={() => {
                        void navigator.clipboard?.writeText(`+91${booking.phone.replace(/\s/g, '')}`);
                        setCopied(true);
                      }}
                    >
                      {copied ? 'Copied' : <CopyIcon />}
                    </button>
                    <a href={`tel:+91${booking.phone.replace(/\s/g, '')}`} aria-label={`Call ${booking.guest}`}>
                      <PhoneIcon />
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Party size</dt>
                  <dd>{booking.party} guests</dd>
                </div>
                <div>
                  <dt>Date and time</dt>
                  <dd>22 Oct 2026, {booking.time} (IST)</dd>
                </div>
                <div>
                  <dt>Floor &amp; area</dt>
                  <dd>{floorArea}</dd>
                </div>
                <div>
                  <dt>Assigned table</dt>
                  <dd>
                    <span className="context-chip">Table {booking.table}</span>
                  </dd>
                </div>
                <div>
                  <dt>Current status</dt>
                  <dd>
                    <span className={`status-badge status-${statusClass(status)}`}>{status}</span>
                  </dd>
                </div>
                <div>
                  <dt>Created by</dt>
                  <dd>Rahul Menon (Staff)</dd>
                </div>
              </dl>
              <div className="instruction-box">
                <p>Special instructions / notes</p>
                <strong>
                  <InfoDot />
                  {note}
                </strong>
              </div>
            </div>

            <div className="spot-card">
              <h2 className="action-kicker">Booking actions</h2>
              <div className="booking-action-row">
                <button className="ghost-action" type="button" disabled={!canSeat} onClick={() => finish('Seated', 'Guest seated.')}>
                  Seat
                </button>
                <button className="sign-in-button today-action" type="button" disabled={!canComplete} onClick={() => finish('Completed', 'Booking completed.')}>
                  Complete
                </button>
                <button className="danger-outline" type="button" disabled={!canCancel} onClick={() => setView('cancel')}>
                  Cancel
                </button>
                <button className="ghost-action" type="button" disabled={!canNoShow} onClick={() => setView('noshow')}>
                  No-show
                </button>
              </div>
              <p className="booking-now">
                <span className="status-dot" aria-hidden="true" />
                {actionNote(status, booking.table)}
              </p>
            </div>
          </>
        )}

        <div className="rooms-sync">
          <p>Booking reference: {reference}</p>
          <p>Last updated: 22 Oct 2026, 12:44 PM by System</p>
        </div>
      </section>

      {dialog ? (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="booking-dialog-title"
            onKeyDown={(event) => {
              if (event.key === 'Escape') closeDialog();
            }}
          >
            <h2 id="booking-dialog-title">
              {view === 'cancel' ? `Cancel ${booking.guest}'s booking?` : `Mark ${booking.guest} as a no-show?`}
            </h2>
            <p>
              {view === 'cancel'
                ? `Table ${booking.table} will be released. The booking stays on today's list as cancelled.`
                : `Table ${booking.table} will be released and the booking will close as a no-show.`}
            </p>
            <div className="modal-actions">
              <button className="edit-button" type="button" onClick={closeDialog}>
                Keep booking
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={() =>
                  finish(view === 'cancel' ? 'Cancelled' : 'No-show', view === 'cancel' ? 'Booking cancelled.' : 'Marked as a no-show.')
                }
              >
                {view === 'cancel' ? 'Cancel booking' : 'Mark no-show'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

function initialView(status: BookingStatus): DetailView {
  if (status === 'Pending') return 'pending';
  if (status === 'Completed') return 'completed';
  if (status === 'Seated') return 'seated';
  return 'record';
}

function statusClass(status: BookingStatus) {
  return status.toLowerCase().replace('-', '');
}

function actionNote(status: BookingStatus, table: number) {
  if (status === 'Pending') return `Seating this guest assigns Table ${table} and starts service.`;
  if (status === 'Seated') return `Completing this booking frees Table ${table} for new spot bookings immediately.`;
  if (status === 'Completed') return `This booking is completed. Table ${table} is free for a new spot booking.`;
  if (status === 'Cancelled') return 'This booking was cancelled and the table has been released.';
  return 'This guest was marked as a no-show and the table has been released.';
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M8 8h10v12H8zM6 16H5V4h10v2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M7 4h3l1 4-2 1a12 12 0 0 0 6 6l1-2 4 1v3a2 2 0 0 1-2 2A16 16 0 0 1 5 6a2 2 0 0 1 2-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoDot() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 11v5M12 8h.01" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
