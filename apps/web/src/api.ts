import type { AccusationInput, CreateCaseInput, PublicCase, PublicResult, SafeJob } from '@mystery/shared';
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!response.ok) { const payload = await response.json().catch(() => null); throw new Error(payload?.error?.message ?? `Request failed (${response.status})`); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const api = {
  me: () => request<{ user: { id: string; email: string; displayName: string } | null }>('/auth/me'),
  login: (email: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email }) }),
  create: (input: CreateCaseInput) => request<{ caseId: string; status: string }>('/cases', { method: 'POST', body: JSON.stringify(input) }),
  list: () => request<{ cases: Array<{ id: string; title: string; status: string; createdAt: string; completed: boolean }> }>('/cases'),
  getCase: (id: string) => request<{ case: PublicCase }>(`/cases/${id}`),
  job: (id: string) => request<{ job: SafeJob }>(`/cases/${id}/job`),
  review: (id: string, evidenceId: string) => request(`/cases/${id}/reviewed`, { method: 'POST', body: JSON.stringify({ evidenceId }) }),
  saveNotes: (id: string, notes: string) => request(`/cases/${id}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) }),
  accuse: (id: string, input: AccusationInput) => request<{ result: PublicResult }>(`/cases/${id}/accusation`, { method: 'POST', body: JSON.stringify(input) }),
  result: (id: string) => request<{ result: PublicResult }>(`/cases/${id}/results`),
  remove: (id: string) => request<void>(`/cases/${id}`, { method: 'DELETE' }),
};
