import { useEffect, useState } from 'react';
import { api } from '../api';
import { AdminShell, type AdminSection } from '../components/AdminShell';
import { readSession } from '../session';
import { EmployeeFormPage } from './EmployeeFormPage';

type EmployeeView = 'default' | 'inactive' | 'nomatch' | 'empty' | 'loading';
type StatusFilter = 'all' | 'active' | 'inactive';

export type Employee = {
  id: string;
  name: string;
  owner?: boolean;
  phone: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Staff';
  active: boolean;
};

type ApiEmployee = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';
  isActive: boolean;
};

export const employees: Employee[] = [
  { id: 'suresh', name: 'Suresh Pillai', owner: true, phone: '+91 98460 20034', email: 'suresh@saffronhouse.in', role: 'Admin', active: true },
  { id: 'latha', name: 'Latha Menon', phone: '+91 94470 66120', email: 'latha@saffronhouse.in', role: 'Manager', active: true },
  { id: 'rahul', name: 'Rahul Menon', phone: '+91 98950 44218', email: 'rahul@saffronhouse.in', role: 'Staff', active: true },
  { id: 'nisha', name: 'Nisha Joseph', phone: '+91 97460 18832', email: 'nisha@saffronhouse.in', role: 'Staff', active: true },
  { id: 'basil', name: 'Basil Thomas', phone: '+91 99610 40571', email: 'basil@saffronhouse.in', role: 'Staff', active: false },
];

const views: { id: EmployeeView; label: string }[] = [
  { id: 'default', label: '1. Default (5)' },
  { id: 'inactive', label: '2. Filter: Inactive (1)' },
  { id: 'nomatch', label: '3. Search: No Match' },
  { id: 'empty', label: '4. Empty State' },
  { id: 'loading', label: '5. Loading Skeleton' },
];

type EmployeesPageProps = {
  onSignOut: () => void;
  onNavigate: (section: AdminSection) => void;
};

export function EmployeesPage({ onSignOut, onNavigate }: EmployeesPageProps) {
  const [view, setView] = useState<EmployeeView>('default');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [directorySource, setDirectorySource] = useState<Employee[]>(() => (readSession()?.organizationId ? [] : employees));

  useEffect(() => {
    const session = readSession();
    if (!session?.organizationId) return;
    api<ApiEmployee[]>(`/organizations/${session.organizationId}/employees`)
      .then((list) => {
        setDirectorySource(
          list.map((employee) => ({
            id: employee.id,
            name: employee.name,
            owner: employee.role === 'OWNER',
            phone: employee.phone ?? '',
            email: employee.email,
            role: employee.role === 'MANAGER' ? 'Manager' : employee.role === 'STAFF' ? 'Staff' : 'Admin',
            active: employee.isActive,
          })),
        );
      })
      .catch(() => setDirectorySource([]));
  }, [creating, editingId]);

  const directory = view === 'empty' ? [] : directorySource;
  const activeCount = directory.filter((employee) => employee.active).length;
  const visible = directory.filter((employee) => {
    const matchesFilter = filter === 'all' || (filter === 'active' ? employee.active : !employee.active);
    const haystack = `${employee.name} ${employee.phone} ${employee.email}`.toLowerCase();
    return matchesFilter && haystack.includes(query.trim().toLowerCase());
  });

  function show(next: EmployeeView) {
    setView(next);
    setQuery(next === 'nomatch' ? 'zzzz' : '');
    setFilter(next === 'inactive' ? 'inactive' : 'all');
  }

  function applyFilter(next: StatusFilter) {
    if (view === 'loading' || view === 'empty') return;
    setFilter(next);
    setView(next === 'inactive' && !query.trim() ? 'inactive' : query.trim() ? view : 'default');
  }

  function search(value: string) {
    if (view === 'loading' || view === 'empty') return;
    setQuery(value);
    const term = value.trim().toLowerCase();
    const matches = employees.filter((employee) => {
      const matchesFilter = filter === 'all' || (filter === 'active' ? employee.active : !employee.active);
      return matchesFilter && `${employee.name} ${employee.phone} ${employee.email}`.toLowerCase().includes(term);
    });
    if (term && matches.length === 0) setView('nomatch');
    else setView(filter === 'inactive' ? 'inactive' : 'default');
  }

  const busy = view === 'loading';

  if (creating || editingId) {
    return (
      <EmployeeFormPage
        employeeId={creating ? undefined : editingId ?? undefined}
        onBack={() => {
          setCreating(false);
          setEditingId(null);
        }}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
      />
    );
  }

  return (
    <AdminShell active="employees" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="inspect-bar floors-inspect">
        <span className="inspect-label">Screen state inspect:</span>
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

      <section className="today-page" aria-labelledby="employees-title">
        <div className="today-heading">
          <div>
            <h1 id="employees-title">Employees</h1>
            <p>
              {directory.length} employee{directory.length === 1 ? '' : 's'}
              <br />
              Manage back-of-house roles, floor clearance and POS login access.
            </p>
          </div>
          <button className="sign-in-button today-action" type="button" onClick={() => setCreating(true)}>
            + Add employee
          </button>
        </div>

        <div className="employee-toolbar">
          <label className="employee-search">
            <SearchIcon />
            <span className="sr-only">Search employees</span>
            <input
              value={query}
              disabled={busy || view === 'empty'}
              placeholder="Search by name, phone or email"
              onChange={(event) => search(event.target.value)}
            />
          </label>
          <div className="status-filters" role="group" aria-label="Filter by status">
            <FilterChip label="All" count={directory.length} pressed={filter === 'all'} disabled={busy || view === 'empty'} onClick={() => applyFilter('all')} />
            <FilterChip label="Active" count={activeCount} pressed={filter === 'active'} disabled={busy || view === 'empty'} onClick={() => applyFilter('active')} />
            <FilterChip
              label="Inactive"
              count={directory.length - activeCount}
              pressed={filter === 'inactive'}
              disabled={busy || view === 'empty'}
              onClick={() => applyFilter('inactive')}
            />
          </div>
        </div>

        {busy ? <EmployeeSkeleton /> : null}
        {view === 'empty' ? (
          <div className="today-empty">
            <h2>No employees yet</h2>
            <p>Add the owner and staff who use the host stand and POS.</p>
          </div>
        ) : null}
        {!busy && view !== 'empty' && visible.length === 0 ? (
          <div className="today-empty">
            <h2>No matching employees</h2>
            <p>No employees match “{query.trim()}”. Try a name, phone number, or email.</p>
          </div>
        ) : null}
        {!busy && view !== 'empty' && visible.length > 0 ? (
          <div className="booking-table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <strong>{employee.name}</strong>
                      {employee.owner ? <span className="owner-pill">Owner</span> : null}
                    </td>
                    <td>{employee.phone}</td>
                    <td>{employee.email}</td>
                    <td>
                      <span className="role-pill">{employee.role}</span>
                    </td>
                    <td>
                      <span className={employee.active ? 'table-status is-active' : 'table-status'}>
                        <i />
                        {employee.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="row-open" type="button" aria-label={`Open ${employee.name}`} onClick={() => setEditingId(employee.id)}>
                        ›
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="rooms-sync">
          <p>
            <span className="status-dot" aria-hidden="true" />
            Connected to Saffron House POS &amp; Employee Directory · {activeCount} active account{activeCount === 1 ? '' : 's'}
          </p>
          <p>DinePoint India Edition · IST (UTC+5:30)</p>
        </div>
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
    <button type="button" className={pressed ? 'filter-chip is-active' : 'filter-chip'} aria-pressed={pressed} disabled={disabled} onClick={onClick}>
      {label} <span>{count}</span>
    </button>
  );
}

function EmployeeSkeleton() {
  return (
    <div className="today-loading" role="status" aria-live="polite">
      <p>Loading employees…</p>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className="skeleton-row" />
      ))}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16l4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
