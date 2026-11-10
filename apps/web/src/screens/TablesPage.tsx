import { useEffect, useState } from 'react';
import { api } from '../api';
import { AdminShell, type AdminSection } from '../components/AdminShell';
import { readSession } from '../session';

type TableView = 'list' | 'add' | 'edit' | 'invalid' | 'empty' | 'saved';
type Climate = 'AC' | 'Non-AC';
type Category = 'Family' | 'Non-family';

type DiningTable = {
  id: string;
  number: string;
  seats: number;
  climate: Climate;
  category: Category;
  active: boolean;
};

type Draft = {
  number: string;
  seats: string;
  climate: Climate;
  category: Category;
  active: boolean;
};

const emptyDraft: Draft = { number: '', seats: '', climate: 'AC', category: 'Non-family', active: true };

const acHallTables: DiningTable[] = [
  { id: 't1', number: 'Table 1', seats: 2, climate: 'AC', category: 'Non-family', active: true },
  { id: 't2', number: 'Table 2', seats: 2, climate: 'AC', category: 'Non-family', active: true },
  { id: 't3', number: 'Table 3', seats: 4, climate: 'AC', category: 'Family', active: true },
  { id: 't4', number: 'Table 4', seats: 4, climate: 'AC', category: 'Family', active: true },
  { id: 't5', number: 'Table 5', seats: 6, climate: 'AC', category: 'Family', active: true },
  { id: 't6', number: 'Table 6', seats: 8, climate: 'AC', category: 'Family', active: false },
];

const roomPresets: Record<string, DiningTable[]> = {
  'ac-hall': acHallTables,
  family: [
    { id: 'f1', number: 'Table 1', seats: 4, climate: 'AC', category: 'Family', active: true },
    { id: 'f2', number: 'Table 2', seats: 4, climate: 'AC', category: 'Family', active: true },
  ],
  private: [],
  cabin: Array.from({ length: 8 }, (_, index) => ({
    id: `c${index + 1}`,
    number: `Table ${index + 1}`,
    seats: 2,
    climate: 'AC' as const,
    category: 'Non-family' as const,
    active: true,
  })),
};

type ApiTable = {
  id: string;
  roomId: string;
  tableNumber: number;
  seats: number;
  isAc: boolean;
  isFamilyFriendly: boolean;
  isActive: boolean;
};

const views: { id: TableView; label: string }[] = [
  { id: 'list', label: '1. Default List (6 Tables)' },
  { id: 'add', label: '2. Add Table Drawer' },
  { id: 'edit', label: '3. Edit Table 3 Drawer' },
  { id: 'invalid', label: '4. Validation Error Drawer' },
  { id: 'empty', label: '5. Empty State' },
  { id: 'saved', label: '6. Saved Toast' },
];

type TablesPageProps = {
  floorId: string;
  floorName: string;
  roomId: string;
  roomName: string;
  onBack: () => void;
  onBackToFloors: () => void;
  onSignOut: () => void;
  onNavigate: (section: AdminSection) => void;
};

export function TablesPage({ floorId, floorName, roomId, roomName, onBack, onBackToFloors, onSignOut, onNavigate }: TablesPageProps) {
  const preset = roomPresets[roomId] ?? [];
  const [view, setView] = useState<TableView>('list');
  const [tables, setTables] = useState<DiningTable[]>(() => (roomId.length > 12 ? [] : preset));
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [numberError, setNumberError] = useState('');
  const [seatsError, setSeatsError] = useState('');

  useEffect(() => {
    const session = readSession();
    if (!session?.organizationId || !session.restaurantId || roomId.length < 12) return;
    api<ApiTable[]>(`/organizations/${session.organizationId}/restaurants/${session.restaurantId}/tables`)
      .then((list) => {
        setTables(
          list
            .filter((table) => table.roomId === roomId)
            .map((table) => ({
              id: table.id,
              number: `Table ${table.tableNumber}`,
              seats: table.seats,
              climate: table.isAc ? 'AC' : 'Non-AC',
              category: table.isFamilyFriendly ? 'Family' : 'Non-family',
              active: table.isActive,
            })),
        );
      })
      .catch(() => undefined);
  }, [roomId]);

  const drawerOpen = view === 'add' || view === 'edit' || view === 'invalid' || editingId !== null;
  const visible = view === 'empty' ? [] : tables;
  const activeCount = visible.filter((table) => table.active).length;
  const seatTotal = visible.reduce((sum, table) => sum + table.seats, 0);

  function show(next: TableView) {
    const nextTables = preset.map((table) => ({ ...table }));
    const table3 = nextTables.find((table) => table.id === 't3') ?? acHallTables[2];
    setTables(nextTables);
    setEditingId(next === 'edit' ? table3.id : null);
    setDraft(next === 'edit' ? toDraft(table3) : emptyDraft);
    setNumberError(next === 'invalid' ? 'Enter a table number.' : '');
    setSeatsError(next === 'invalid' ? 'Enter the number of seats.' : '');
    setView(next);
  }

  function openAdd() {
    setEditingId(null);
    setDraft(emptyDraft);
    setNumberError('');
    setSeatsError('');
    setView('add');
  }

  function openEdit(table: DiningTable) {
    setEditingId(table.id);
    setDraft(toDraft(table));
    setNumberError('');
    setSeatsError('');
    setView(table.id === 't3' ? 'edit' : 'list');
  }

  function closeDrawer() {
    setEditingId(null);
    setNumberError('');
    setSeatsError('');
    setView('list');
  }

  function saveTable() {
    const number = draft.number.trim();
    const seats = Number(draft.seats);
    const nextNumberError = number.length < 1 ? 'Enter a table number.' : '';
    const nextSeatsError = !Number.isInteger(seats) || seats < 1 ? 'Enter the number of seats.' : '';
    const duplicate = tables.some((table) => table.id !== editingId && table.number.toLowerCase() === number.toLowerCase());
    setNumberError(duplicate ? 'A table with this number already exists.' : nextNumberError);
    setSeatsError(nextSeatsError);
    if (nextNumberError || nextSeatsError || duplicate) {
      setView('invalid');
      return;
    }
    const nextTable: DiningTable = {
      id: editingId ?? number.toLowerCase().replace(/\s+/g, '-'),
      number,
      seats,
      climate: draft.climate,
      category: draft.category,
      active: draft.active,
    };
    setTables((current) =>
      editingId ? current.map((table) => (table.id === editingId ? nextTable : table)) : [...current, nextTable],
    );
    const session = readSession();
    const tableNumber = Number(number.replace(/\D/g, ''));
    if (session?.organizationId && session.restaurantId && roomId.length > 12 && Number.isInteger(tableNumber)) {
      const body = {
        tableNumber,
        seats,
        floorId,
        roomId,
        isAc: draft.climate === 'AC',
        isFamilyFriendly: draft.category === 'Family',
        isActive: draft.active,
      };
      const path = `/organizations/${session.organizationId}/restaurants/${session.restaurantId}/tables`;
      void api(editingId && editingId.length > 12 ? `${path}/${editingId}` : path, {
        method: editingId && editingId.length > 12 ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
    }
    setEditingId(null);
    setView('saved');
  }

  const drawerTitle = view === 'edit' || editingId ? `Edit ${draft.number || 'table'}` : 'Add table';

  return (
    <AdminShell active="floors" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="inspect-bar floors-inspect">
        <span className="inspect-label">Scenarios:</span>
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

      <section className="today-page" aria-labelledby="tables-title">
        <p className="crumb">
          <button type="button" onClick={onBackToFloors}>
            Floors
          </button>
          <span aria-hidden="true">&gt;</span>
          <button type="button" onClick={onBack}>
            {floorName}
          </button>
          <span aria-hidden="true">&gt;</span>
          {roomName}
        </p>
        <div className="today-heading">
          <div className="rooms-heading">
            <button className="back-button" type="button" aria-label="Back to rooms" onClick={onBack}>
              ←
            </button>
            <div>
              <h1 id="tables-title">Tables</h1>
              <div className="tables-summary">
                <span className="context-chip">Floor: {floorName}</span>
                <span className="context-chip">Room: {roomName}</span>
                <span>
                  {visible.length} configured table{visible.length === 1 ? '' : 's'} · {activeCount} active,{' '}
                  {visible.length - activeCount} inactive · Total capacity: {seatTotal} seats
                </span>
              </div>
            </div>
          </div>
          <button className="sign-in-button today-action" type="button" onClick={openAdd}>
            + Add table
          </button>
        </div>

        {view === 'saved' ? <p className="save-toast">Table details saved.</p> : null}

        {view === 'empty' ? (
          <div className="today-empty floor-empty">
            <h2>No tables yet</h2>
            <p>Add a table to seat guests in {roomName}.</p>
          </div>
        ) : (
          <div className="booking-table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Table number</th>
                  <th>Seats</th>
                  <th>Climate</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((table) => (
                  <tr key={table.id}>
                    <td>
                      <strong>{table.number}</strong>
                    </td>
                    <td>{table.seats} seats</td>
                    <td>
                      <span className="context-chip">{table.climate}</span>
                    </td>
                    <td>
                      <span className="context-chip">{table.category}</span>
                    </td>
                    <td>
                      <span className={table.active ? 'table-status is-active' : 'table-status'}>
                        <i />
                        {table.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="edit-row-button" type="button" onClick={() => openEdit(table)}>
                        <PencilIcon />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="rooms-sync">
          <p>
            <span className="status-dot" aria-hidden="true" />
            Connected to Saffron House POS &amp; Table Synchronizer · {floorName} Floor / {roomName} ({visible.length}{' '}
            tables)
          </p>
          <p>DinePoint India Edition · IST (UTC+5:30)</p>
        </div>
      </section>

      {drawerOpen ? (
        <div className="drawer-backdrop">
          <form
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="table-drawer-title"
            onSubmit={(event) => {
              event.preventDefault();
              saveTable();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') closeDrawer();
            }}
          >
            <div className="drawer-heading">
              <h2 id="table-drawer-title">{drawerTitle}</h2>
              <button className="icon-button" type="button" aria-label="Close" onClick={closeDrawer}>
                ×
              </button>
            </div>
            <p className="drawer-copy">
              {roomName} on the {floorName} floor. This table is used for spot booking and the host stand.
            </p>
            <label className="field">
              Table number *
              <input
                value={draft.number}
                aria-invalid={Boolean(numberError)}
                autoFocus
                onChange={(event) => {
                  setDraft({ ...draft, number: event.target.value });
                  if (numberError) setNumberError('');
                }}
              />
              {numberError ? <span className="field-error">{numberError}</span> : null}
            </label>
            <label className="field">
              Seats *
              <input
                inputMode="numeric"
                value={draft.seats}
                aria-invalid={Boolean(seatsError)}
                onChange={(event) => {
                  setDraft({ ...draft, seats: event.target.value });
                  if (seatsError) setSeatsError('');
                }}
              />
              {seatsError ? <span className="field-error">{seatsError}</span> : <span className="field-hint">Guest seats at this table.</span>}
            </label>
            <label className="field">
              Climate
              <select
                value={draft.climate}
                onChange={(event) => setDraft({ ...draft, climate: event.target.value as Climate })}
              >
                <option>AC</option>
                <option>Non-AC</option>
              </select>
            </label>
            <label className="field">
              Category
              <select
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value as Category })}
              >
                <option>Family</option>
                <option>Non-family</option>
              </select>
            </label>
            <div className={draft.active ? 'availability is-on' : 'availability'}>
              <div>
                <strong>Active</strong>
                <p>Inactive tables are hidden from new spot bookings.</p>
              </div>
              <button
                className={draft.active ? 'switch is-on' : 'switch'}
                type="button"
                role="switch"
                aria-checked={draft.active}
                aria-label="Active table"
                onClick={() => setDraft({ ...draft, active: !draft.active })}
              />
            </div>
            <div className="modal-actions">
              <button className="edit-button" type="button" onClick={closeDrawer}>
                Cancel
              </button>
              <button className="sign-in-button modal-primary" type="submit">
                Save table
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AdminShell>
  );
}

function toDraft(table: DiningTable): Draft {
  return {
    number: table.number,
    seats: String(table.seats),
    climate: table.climate,
    category: table.category,
    active: table.active,
  };
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="M4 20h4l10-10-4-4L4 16v4zM13 7l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
