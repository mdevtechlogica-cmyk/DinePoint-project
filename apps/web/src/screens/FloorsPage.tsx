import { useEffect, useState } from 'react';
import { api } from '../api';
import { AdminShell, type AdminSection } from '../components/AdminShell';
import { readSession } from '../session';

type FloorView = 'list' | 'rename' | 'add' | 'deactivate' | 'empty' | 'invalid';

type Floor = {
  id: string;
  name: string;
  rooms: number;
  tables: number;
  active: boolean;
};

const starterFloors: Floor[] = [
  { id: 'ground', name: 'Ground', rooms: 2, tables: 18, active: true },
  { id: 'first', name: 'First', rooms: 1, tables: 8, active: true },
  { id: 'terrace', name: 'Terrace', rooms: 0, tables: 0, active: false },
];

type ApiFloor = {
  id: string;
  name: string;
  isActive: boolean;
  rooms: { id: string }[];
  _count: { tables: number };
};

function sampleFloor(id: string) {
  return id === 'ground' || id === 'first' || id === 'terrace';
}

const views: { id: FloorView; label: string }[] = [
  { id: 'list', label: '1. Default List' },
  { id: 'rename', label: '2. Inline Rename (First)' },
  { id: 'add', label: '3. Add Floor Modal' },
  { id: 'deactivate', label: '4. Deactivate Dialog (Ground)' },
  { id: 'empty', label: '5. Empty State' },
  { id: 'invalid', label: '6. Modal Validation Error' },
];

type FloorsPageProps = {
  onSignOut: () => void;
  onNavigate: (section: AdminSection) => void;
  onOpenFloor: (floor: { id: string; name: string }) => void;
};

export function FloorsPage({ onSignOut, onNavigate, onOpenFloor }: FloorsPageProps) {
  const [view, setView] = useState<FloorView>('list');
  const [floors, setFloors] = useState<Floor[]>(() => (readSession()?.restaurantId ? [] : starterFloors));
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');
  const [floorName, setFloorName] = useState('');
  const [nameError, setNameError] = useState('');
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  async function reload() {
    const session = readSession();
    if (!session?.organizationId || !session.restaurantId) return;
    const list = await api<ApiFloor[]>(
      `/organizations/${session.organizationId}/restaurants/${session.restaurantId}/floors`,
    );
    setFloors(
      list.map((floor) => ({
        id: floor.id,
        name: floor.name,
        rooms: floor.rooms.length,
        tables: floor._count.tables,
        active: floor.isActive,
      })),
    );
  }

  useEffect(() => {
    reload().catch(() => undefined);
  }, []);

  const modalOpen = view === 'add' || view === 'invalid';
  const dialogOpen = view === 'deactivate';
  const visibleFloors = view === 'empty' ? [] : floors;
  const configured = view === 'empty' ? 0 : floors.length;

  function show(next: FloorView) {
    setFloors(starterFloors.map((floor) => ({ ...floor })));
    setRenamingId(next === 'rename' ? 'first' : null);
    setRenameValue(next === 'rename' ? 'First' : '');
    setRenameError('');
    setFloorName('');
    setNameError(next === 'invalid' ? 'Enter a floor name.' : '');
    setDeactivateId(next === 'deactivate' ? 'ground' : null);
    setView(next);
  }

  function openAdd() {
    setFloorName('');
    setNameError('');
    setView('add');
  }

  function openDeactivate(id: string) {
    setDeactivateId(id);
    setView('deactivate');
  }

  function closeOverlay() {
    setRenamingId(null);
    setRenameValue('');
    setRenameError('');
    setFloorName('');
    setNameError('');
    setDeactivateId(null);
    setView('list');
  }

  function beginRename(floor: Floor) {
    setRenamingId(floor.id);
    setRenameValue(floor.name);
    setRenameError('');
    setView(floor.id === 'first' ? 'rename' : 'list');
  }

  function saveRename() {
    const name = renameValue.trim();
    if (name.length < 2) {
      setRenameError('Enter a floor name.');
      return;
    }
    setFloors((current) => current.map((floor) => (floor.id === renamingId ? { ...floor, name } : floor)));
    const session = readSession();
    if (session?.organizationId && session.restaurantId && renamingId && !sampleFloor(renamingId)) {
      void api(`/organizations/${session.organizationId}/restaurants/${session.restaurantId}/floors/${renamingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
    }
    setRenamingId(null);
    setRenameError('');
    setView('list');
  }

  function confirmDeactivate() {
    setFloors((current) => current.map((floor) => (floor.id === deactivateId ? { ...floor, active: false } : floor)));
    const session = readSession();
    if (session?.organizationId && session.restaurantId && deactivateId && !sampleFloor(deactivateId)) {
      void api(`/organizations/${session.organizationId}/restaurants/${session.restaurantId}/floors/${deactivateId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      });
    }
    closeOverlay();
  }

  function submitFloor() {
    const name = floorName.trim();
    if (name.length < 2) {
      setNameError('Enter a floor name.');
      setView('invalid');
      return;
    }
    const duplicate = floors.some((floor) => floor.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setNameError('A floor with this name already exists.');
      setView('invalid');
      return;
    }
    const session = readSession();
    if (session?.organizationId && session.restaurantId) {
      void api(`/organizations/${session.organizationId}/restaurants/${session.restaurantId}/floors`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }).then(() => reload());
    } else {
      setFloors((current) => [
        ...current,
        { id: name.toLowerCase().replace(/\s+/g, '-'), name, rooms: 0, tables: 0, active: true },
      ]);
    }
    setFloorName('');
    setNameError('');
    setView('list');
  }

  const deactivateFloor = floors.find((floor) => floor.id === deactivateId) ?? starterFloors[0];

  return (
    <AdminShell active="floors" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="inspect-bar floors-inspect">
        <span className="inspect-label">
          <InspectorIcon />
          Interactive scenario inspector
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
        <p className="inspect-build">DinePoint POS · Build 4.19</p>
      </div>

      <section className="today-page" aria-labelledby="floors-title">
        <div className="today-heading">
          <div>
            <h1 id="floors-title">Floors</h1>
            <p>
              Floors in {readSession()?.restaurantName ?? 'Saffron House'} · {configured} configured floor{configured === 1 ? '' : 's'}
            </p>
          </div>
          <button className="sign-in-button today-action" type="button" onClick={openAdd}>
            + Add floor
          </button>
        </div>

        {view === 'empty' ? (
          <div className="today-empty floor-empty">
            <span className="floor-icon floor-icon-lg" aria-hidden="true">
              <FloorGlyph id="terrace" />
            </span>
            <h2>No floors yet</h2>
            <p>Add a floor to arrange rooms and tables for Saffron House.</p>
          </div>
        ) : (
          <ul className="floor-list">
            {visibleFloors.map((floor) => {
              const renaming = floor.id === renamingId && !modalOpen && !dialogOpen;
              return (
                <li key={floor.id} className="floor-row">
                  <span className="floor-icon" aria-hidden="true">
                    <FloorGlyph id={floor.id} />
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
                          aria-label="Floor name"
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
                        {floor.name}
                        <span className={floor.active ? 'floor-status is-active' : 'floor-status'}>
                          {floor.active ? 'Active' : 'Inactive'}
                        </span>
                      </strong>
                    )}
                    <p>
                      {floor.rooms} room{floor.rooms === 1 ? '' : 's'} · {floor.tables} table{floor.tables === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="floor-actions">
                    <button className="text-action" type="button" onClick={() => beginRename(floor)}>
                      Rename
                    </button>
                    {floor.active ? (
                      <button className="text-action is-danger" type="button" onClick={() => openDeactivate(floor.id)}>
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="text-action is-positive"
                        type="button"
                        onClick={() => {
                          setFloors((current) =>
                            current.map((item) => (item.id === floor.id ? { ...item, active: true } : item)),
                          );
                          const session = readSession();
                          if (session?.organizationId && session.restaurantId && !sampleFloor(floor.id)) {
                            void api(`/organizations/${session.organizationId}/restaurants/${session.restaurantId}/floors/${floor.id}`, {
                              method: 'PATCH',
                              body: JSON.stringify({ isActive: true }),
                            });
                          }
                        }}
                      >
                        Activate
                      </button>
                    )}
                    <button
                      className="row-open"
                      type="button"
                      aria-label={`Open ${floor.name}`}
                      onClick={() => onOpenFloor({ id: floor.id, name: floor.name })}
                    >
                      ›
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="today-meta">
          <p>
            <span className="status-dot" aria-hidden="true" />
            Connected to Saffron House POS &amp; Table Synchronizer · {configured} Floor{configured === 1 ? '' : 's'}{' '}
            configured
          </p>
          <p className="key-hints">DinePoint India Edition · IST (UTC+05:30)</p>
        </div>
      </section>

      {modalOpen ? (
        <div className="modal-backdrop">
          <form
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-floor-title"
            onSubmit={(event) => {
              event.preventDefault();
              submitFloor();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') closeOverlay();
            }}
          >
            <h2 id="add-floor-title">Add floor</h2>
            <p>Create a floor for Saffron House. Rooms and tables can be placed on it after it is saved.</p>
            <label className="field">
              Floor name *
              <input
                value={floorName}
                aria-invalid={Boolean(nameError)}
                autoFocus
                onChange={(event) => {
                  setFloorName(event.target.value);
                  if (nameError) setNameError('');
                }}
              />
              {nameError ? (
                <span className="field-error">{nameError}</span>
              ) : (
                <span className="field-hint">Shown on the host stand, KOT routing, and the table map.</span>
              )}
            </label>
            <div className="modal-actions">
              <button className="edit-button" type="button" onClick={closeOverlay}>
                Cancel
              </button>
              <button className="sign-in-button modal-primary" type="submit">
                Add floor
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
            aria-labelledby="deactivate-title"
            aria-describedby="deactivate-copy"
            onKeyDown={(event) => {
              if (event.key === 'Escape') closeOverlay();
            }}
          >
            <h2 id="deactivate-title">Deactivate {deactivateFloor.name}?</h2>
            <p id="deactivate-copy">
              {deactivateFloor.name} has {deactivateFloor.rooms} room{deactivateFloor.rooms === 1 ? '' : 's'} and{' '}
              {deactivateFloor.tables} table{deactivateFloor.tables === 1 ? '' : 's'}. The front desk cannot seat new
              spot bookings on this floor until it is activated again.
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

function FloorGlyph({ id }: { id: string }) {
  const path =
    id === 'ground'
      ? 'M4 7h16M4 12h16M4 17h16'
      : id === 'first'
        ? 'M12 3.5 20 8.5 12 13.5 4 8.5 12 3.5ZM4.5 13.5 12 18.5l7.5-5'
        : 'M4 20V10l8-6 8 6v10M9 20v-6h6v6';

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InspectorIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}
