import { useEffect, useState } from 'react';
import { api } from '../api';
import { AdminShell, type AdminSection } from '../components/AdminShell';
import { readSession } from '../session';

type RoomView = 'list' | 'rename' | 'add' | 'deactivate' | 'empty' | 'invalid';

type Room = {
  id: string;
  name: string;
  tables: number;
  active: boolean;
  glyph: 'layout' | 'grid' | 'door';
};

const groundRooms: Room[] = [
  { id: 'ac-hall', name: 'AC Hall', tables: 6, active: true, glyph: 'layout' },
  { id: 'family', name: 'Family Room', tables: 2, active: true, glyph: 'grid' },
  { id: 'private', name: 'Private Dining', tables: 0, active: false, glyph: 'door' },
];

const floorPresets: Record<string, { capacity: number; rooms: Room[] }> = {
  ground: { capacity: 36, rooms: groundRooms },
  first: {
    capacity: 16,
    rooms: [{ id: 'cabin', name: 'Window Cabin', tables: 8, active: true, glyph: 'grid' }],
  },
  terrace: { capacity: 0, rooms: [] },
};

type ApiRoom = { id: string; name: string; isActive: boolean; _count: { tables: number } };

const views: { id: RoomView; label: string }[] = [
  { id: 'list', label: '1. Default List' },
  { id: 'rename', label: '2. Inline Rename (Family Room)' },
  { id: 'add', label: '3. Add Room Modal' },
  { id: 'deactivate', label: '4. Deactivate Dialog (AC Hall)' },
  { id: 'empty', label: '5. Empty State' },
  { id: 'invalid', label: '6. Modal Validation Error' },
];

type RoomsPageProps = {
  floorId: string;
  floorName: string;
  onBack: () => void;
  onOpenRoom: (room: { id: string; name: string }) => void;
  onSignOut: () => void;
  onNavigate: (section: AdminSection) => void;
};

export function RoomsPage({ floorId, floorName, onBack, onOpenRoom, onSignOut, onNavigate }: RoomsPageProps) {
  const preset = floorPresets[floorId] ?? { capacity: 0, rooms: [] };
  const [view, setView] = useState<RoomView>('list');
  const [rooms, setRooms] = useState<Room[]>(() => (floorId.length > 12 ? [] : preset.rooms));
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');
  const [roomName, setRoomName] = useState('');
  const [nameError, setNameError] = useState('');
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  async function reload() {
    const session = readSession();
    if (!session?.organizationId || !session.restaurantId || floorId.length < 12) return;
    const list = await api<ApiRoom[]>(
      `/organizations/${session.organizationId}/restaurants/${session.restaurantId}/floors/${floorId}/rooms`,
    );
    setRooms(
      list.map((room) => ({
        id: room.id,
        name: room.name,
        tables: room._count.tables,
        active: room.isActive,
        glyph: 'grid' as const,
      })),
    );
  }

  useEffect(() => {
    reload().catch(() => undefined);
  }, [floorId]);

  const modalOpen = view === 'add' || view === 'invalid';
  const dialogOpen = view === 'deactivate';
  const visibleRooms = view === 'empty' ? [] : rooms;
  const activeCount = visibleRooms.filter((room) => room.active).length;
  const inactiveCount = visibleRooms.length - activeCount;
  const tableTotal = visibleRooms.reduce((sum, room) => sum + room.tables, 0);
  const capacity = view === 'empty' ? 0 : preset.capacity;

  function show(next: RoomView) {
    const nextRooms = preset.rooms.map((room) => ({ ...room }));
    const renameRoom = nextRooms.find((room) => room.id === 'family') ?? nextRooms[0];
    setRooms(nextRooms);
    setRenamingId(next === 'rename' ? (renameRoom?.id ?? null) : null);
    setRenameValue(next === 'rename' ? (renameRoom?.name ?? 'Family Room') : '');
    setRenameError('');
    setRoomName('');
    setNameError(next === 'invalid' ? 'Enter a room name.' : '');
    setDeactivateId(next === 'deactivate' ? 'ac-hall' : null);
    setView(next);
  }

  function openAdd() {
    setRenamingId(null);
    setRoomName('');
    setNameError('');
    setView('add');
  }

  function openDeactivate(id: string) {
    setRenamingId(null);
    setDeactivateId(id);
    setView('deactivate');
  }

  function closeOverlay() {
    setRenamingId(null);
    setRenameValue('');
    setRenameError('');
    setRoomName('');
    setNameError('');
    setDeactivateId(null);
    setView('list');
  }

  function beginRename(room: Room) {
    setRenamingId(room.id);
    setRenameValue(room.name);
    setRenameError('');
    setView(room.id === 'family' ? 'rename' : 'list');
  }

  function saveRename() {
    const name = renameValue.trim();
    if (name.length < 2) {
      setRenameError('Enter a room name.');
      return;
    }
    setRooms((current) => current.map((room) => (room.id === renamingId ? { ...room, name } : room)));
    const session = readSession();
    if (session?.organizationId && session.restaurantId && renamingId && renamingId.length > 12) {
      void api(`/organizations/${session.organizationId}/restaurants/${session.restaurantId}/floors/${floorId}/rooms/${renamingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
    }
    setRenamingId(null);
    setRenameError('');
    setView('list');
  }

  function confirmDeactivate() {
    setRooms((current) => current.map((room) => (room.id === deactivateId ? { ...room, active: false } : room)));
    const session = readSession();
    if (session?.organizationId && session.restaurantId && deactivateId && deactivateId.length > 12) {
      void api(`/organizations/${session.organizationId}/restaurants/${session.restaurantId}/floors/${floorId}/rooms/${deactivateId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      });
    }
    closeOverlay();
  }

  function submitRoom() {
    const name = roomName.trim();
    if (name.length < 2) {
      setNameError('Enter a room name.');
      setView('invalid');
      return;
    }
    const duplicate = rooms.some((room) => room.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setNameError('A room with this name already exists.');
      setView('invalid');
      return;
    }
    const session = readSession();
    if (session?.organizationId && session.restaurantId && floorId.length > 12) {
      void api(`/organizations/${session.organizationId}/restaurants/${session.restaurantId}/floors/${floorId}/rooms`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }).then(() => reload());
    } else {
      setRooms((current) => [...current, { id: name.toLowerCase().replace(/\s+/g, '-'), name, tables: 0, active: true, glyph: 'grid' }]);
    }
    setRoomName('');
    setNameError('');
    setView('list');
  }

  const deactivateRoom = rooms.find((room) => room.id === deactivateId) ?? groundRooms[0];

  return (
    <AdminShell active="floors" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="inspect-bar floors-inspect">
        <span className="inspect-label">
          <FlagIcon />
          Screen state inspect:
        </span>
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

      <section className="today-page" aria-labelledby="rooms-title">
        <p className="crumb">
          <button type="button" onClick={onBack}>
            Floors
          </button>
          <span aria-hidden="true">/</span>
          {floorName}
        </p>
        <div className="today-heading">
          <div className="rooms-heading">
            <button className="back-button" type="button" aria-label="Back to floors" onClick={onBack}>
              ←
            </button>
            <div>
              <h1 id="rooms-title">{floorName} floor: Rooms</h1>
              <p>
                Rooms on the {floorName} floor · {activeCount} active, {inactiveCount} inactive
              </p>
            </div>
          </div>
          <button className="sign-in-button today-action" type="button" onClick={openAdd}>
            + Add room
          </button>
        </div>

        {view === 'empty' ? (
          <div className="today-empty floor-empty">
            <span className="floor-icon floor-icon-lg" aria-hidden="true">
              <RoomGlyph glyph="door" />
            </span>
            <h2>No rooms yet</h2>
            <p>Add a room to place tables on the {floorName} floor.</p>
          </div>
        ) : (
          <ul className="floor-list">
            {visibleRooms.map((room) => {
              const renaming = room.id === renamingId && !modalOpen && !dialogOpen;
              return (
                <li key={room.id} className="floor-row">
                  <span className={room.active ? 'floor-icon is-live' : 'floor-icon'} aria-hidden="true">
                    <RoomGlyph glyph={room.glyph} />
                  </span>
                  <div className="floor-copy">
                    {renaming ? (
                      <form
                        className="inline-rename"
                        onSubmit={(event) => {
                          event.preventDefault();
                          saveRename();
                        }}
                      >
                        <input
                          aria-label="Room name"
                          aria-invalid={Boolean(renameError)}
                          className="is-preview-focus"
                          value={renameValue}
                          autoFocus
                          onChange={(event) => {
                            setRenameValue(event.target.value);
                            setRenameError('');
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') closeOverlay();
                          }}
                        />
                        <button className="rename-save" type="submit">
                          Save
                        </button>
                        <button className="rename-cancel" type="button" onClick={closeOverlay}>
                          Cancel
                        </button>
                        {renameError ? <span className="field-error">{renameError}</span> : null}
                      </form>
                    ) : (
                      <strong>
                        {room.name}
                        <span className={room.active ? 'floor-status is-active' : 'floor-status'}>
                          {room.active ? 'Active' : 'Inactive'}
                        </span>
                      </strong>
                    )}
                    <p>
                      {room.tables} table{room.tables === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="floor-actions">
                    <button className="text-action" type="button" onClick={() => beginRename(room)}>
                      Rename
                    </button>
                    {room.active ? (
                      <button className="text-action is-danger" type="button" onClick={() => openDeactivate(room.id)}>
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="text-action is-positive"
                        type="button"
                        onClick={() =>
                          setRooms((current) => current.map((item) => (item.id === room.id ? { ...item, active: true } : item)))
                        }
                      >
                        Activate
                      </button>
                    )}
                    <button
                      className="row-open"
                      type="button"
                      aria-label={`Open ${room.name}`}
                      onClick={() => onOpenRoom({ id: room.id, name: room.name })}
                    >
                      ›
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="rooms-note">
          <p>
            <InfoIcon />
            Reorder rooms anytime in floor layout settings.
          </p>
          <p>
            Capacity: <strong>{capacity} Seats</strong>
            <span aria-hidden="true">·</span>
            Active Zones: <strong>{activeCount} of {visibleRooms.length}</strong>
          </p>
        </div>
        <div className="rooms-sync">
          <p>
            <span className="status-dot" aria-hidden="true" />
            Connected to Saffron House POS &amp; Table Synchronizer · {floorName} Floor ({tableTotal} tables total)
          </p>
          <p>DinePoint India Edition · IST (UTC+5:30)</p>
        </div>
      </section>

      {modalOpen ? (
        <div className="modal-backdrop">
          <form
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-room-title"
            onSubmit={(event) => {
              event.preventDefault();
              submitRoom();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') closeOverlay();
            }}
          >
            <h2 id="add-room-title">Add room</h2>
            <p>Create a room on the {floorName} floor. Tables can be placed in it after it is saved.</p>
            <label className="field">
              Room name *
              <input
                value={roomName}
                aria-invalid={Boolean(nameError)}
                autoFocus
                onChange={(event) => {
                  setRoomName(event.target.value);
                  if (nameError) setNameError('');
                }}
              />
              {nameError ? (
                <span className="field-error">{nameError}</span>
              ) : (
                <span className="field-hint">Shown on the host stand and the table map.</span>
              )}
            </label>
            <div className="modal-actions">
              <button className="edit-button" type="button" onClick={closeOverlay}>
                Cancel
              </button>
              <button className="sign-in-button modal-primary" type="submit">
                Add room
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {dialogOpen ? (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="deactivate-room-title"
            aria-describedby="deactivate-room-copy"
            onKeyDown={(event) => {
              if (event.key === 'Escape') closeOverlay();
            }}
          >
            <h2 id="deactivate-room-title">Deactivate {deactivateRoom.name}?</h2>
            <p id="deactivate-room-copy">
              {deactivateRoom.name} has {deactivateRoom.tables} table{deactivateRoom.tables === 1 ? '' : 's'}. The front
              desk cannot seat new spot bookings in this room until it is activated again.
            </p>
            <div className="modal-actions">
              <button className="edit-button" type="button" onClick={closeOverlay}>
                Cancel
              </button>
              <button className="danger-button" type="button" onClick={confirmDeactivate}>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

function RoomGlyph({ glyph }: { glyph: Room['glyph'] }) {
  const path =
    glyph === 'layout'
      ? 'M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z'
      : glyph === 'grid'
        ? 'M4 7h16v12H4zM4 12h16M9 7v12M15 7v12'
        : 'M7 4h8a2 2 0 0 1 2 2v14H7V4zM15 12h.01';

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M6 4v16M6 5h11l-2 3 2 3H6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
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
