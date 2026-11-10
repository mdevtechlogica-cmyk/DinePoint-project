import { clearSession, readSession } from './session';

const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = readSession()?.accessToken;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${base}${path}`, { ...init, headers });
  if (response.status === 401) clearSession();
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? (JSON.parse(text) as { message?: string | string[] }) : null;
  if (!response.ok) {
    const message = data?.message;
    throw new ApiError(
      response.status,
      Array.isArray(message) ? message.join(' ') : message || 'The request could not be completed.',
    );
  }
  return data as T;
}

export async function apiText(path: string) {
  const headers = new Headers();
  const token = readSession()?.accessToken;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${base}${path}`, { headers });
  const text = await response.text();
  if (!response.ok) throw new ApiError(response.status, 'The report could not be exported.');
  return text;
}

export function kolkataDayRange(date = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const start = new Date(`${day}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function formatWhen(value: string | Date, withTime = true) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : {}),
  }).format(date);
}

export function formatTime(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function toIso(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function money(value: string | number) {
  return Number(value);
}
