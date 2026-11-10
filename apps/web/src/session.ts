export type Membership = {
  organizationId: string;
  role: string;
  organization: { name: string; slug: string };
};

export type Session = {
  accessToken: string;
  user: { id: string; name: string; email: string };
  memberships: Membership[];
  organizationId: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  platformRole: string | null;
};

const key = 'dinepoint.session';

export function readSession(): Session | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(key, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(key);
}

export function currentOrganization() {
  const session = readSession();
  if (!session?.organizationId) return null;
  return session.memberships.find((item) => item.organizationId === session.organizationId) ?? null;
}
