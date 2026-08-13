import type { AuthCredentials, AuthSession, CreateFragmentInput, Fragment, UpdateFragmentInput } from '@fragments/shared';

const baseUrl = import.meta.env.VITE_API_URL ?? '';
const apiPrefix = baseUrl ? '' : (import.meta.env.DEV ? '' : '/api');
export const isTrialMode = import.meta.env.VITE_TRIAL_MODE === 'true';
export const signupEnabled = import.meta.env.VITE_ENABLE_SIGNUP === 'true';

const TRIAL_STORAGE_KEY = 'fragments-trial-v1';

function welcomeFragments(): Fragment[] {
  const now = new Date();
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return [
  {
    id: 'demo-morning-walk',
    title: 'Morning walk',
    content: 'Marco stopped to look at a ladybug on the way to school. He said it was wearing a tiny red coat.',
    source: 'text',
    createdAt: `${day}T08:42:00.000Z`,
    updatedAt: `${day}T08:42:00.000Z`
  },
  {
    id: 'demo-idea',
    title: 'A small idea',
    content: 'Make room for thoughts before asking them to become useful.',
    source: 'text',
    createdAt: `${day}T11:16:00.000Z`,
    updatedAt: `${day}T11:16:00.000Z`
  }
  ];
}

type TrialStore = { version: 1; fragmentsByDate: Record<string, Fragment[]> };
function groupByDate(fragments: Fragment[]): TrialStore {
  return { version: 1, fragmentsByDate: fragments.reduce<Record<string, Fragment[]>>((groups, fragment) => {
    (groups[fragment.createdAt.slice(0, 10)] ??= []).push(fragment);
    return groups;
  }, {}) };
}
function flatten(store: TrialStore): Fragment[] { return Object.values(store.fragmentsByDate).flat(); }
function isFragment(value: unknown): value is Fragment {
  if (!value || typeof value !== 'object') return false;
  const fragment = value as Partial<Fragment>;
  return typeof fragment.id === 'string' && (fragment.title === null || typeof fragment.title === 'string') && typeof fragment.content === 'string' && (fragment.source === 'text' || fragment.source === 'voice') && typeof fragment.createdAt === 'string' && typeof fragment.updatedAt === 'string';
}
function readTrialStore(): TrialStore {
  const fallback = groupByDate(welcomeFragments());
  try {
    const raw = localStorage.getItem(TRIAL_STORAGE_KEY);
    if (!raw) { localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(fallback)); return fallback; }
    const parsed = JSON.parse(raw) as Partial<TrialStore>;
    if (parsed.version !== 1 || !parsed.fragmentsByDate || typeof parsed.fragmentsByDate !== 'object' || !Object.values(parsed.fragmentsByDate).every(value => Array.isArray(value) && value.every(isFragment))) throw new Error('Invalid trial storage');
    return { version: 1, fragmentsByDate: parsed.fragmentsByDate as Record<string, Fragment[]> };
  } catch { return fallback; }
}
function writeTrialStore(store: TrialStore): void {
  try { localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(store)); } catch { /* Storage can be unavailable. */ }
}
let trialStore = readTrialStore();

const demoApi = {
  list(date: string) { return Promise.resolve([...(trialStore.fragmentsByDate[date] ?? [])]); },
  create(input: CreateFragmentInput) {
    const now = new Date().toISOString();
    const fragment: Fragment = { id: crypto.randomUUID(), title: input.title?.trim() || null, content: input.content.trim(), source: 'text', createdAt: `${input.date}T${now.slice(11)}`, updatedAt: now };
    trialStore = groupByDate([...flatten(trialStore), fragment]); writeTrialStore(trialStore);
    return Promise.resolve(fragment);
  },
  update(id: string, input: UpdateFragmentInput) {
    const fragment = flatten(trialStore).find((candidate) => candidate.id === id);
    if (!fragment) return Promise.reject(new Error('Fragment not found'));
    if (input.title !== undefined) fragment.title = input.title?.trim() || null;
    if (input.content !== undefined) fragment.content = input.content.trim();
    fragment.updatedAt = new Date().toISOString();
    trialStore = groupByDate(flatten(trialStore)); writeTrialStore(trialStore);
    return Promise.resolve(fragment);
  },
  remove(id: string) {
    const fragments = flatten(trialStore);
    const index = fragments.findIndex((fragment) => fragment.id === id);
    if (index === -1) return Promise.reject(new Error('Fragment not found'));
    fragments.splice(index, 1); trialStore = groupByDate(fragments); writeTrialStore(trialStore);
    return Promise.resolve();
  },
  transcribe() { return Promise.reject(new Error('Voice transcription is unavailable in trial mode.')); }
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error ?? 'Request failed');
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

const liveApi = {
  list(date: string) { return request<Fragment[]>(`${apiPrefix}/fragments?date=${date}`); },
  create(input: CreateFragmentInput) { return request<Fragment>(`${apiPrefix}/fragments`, { method: 'POST', body: JSON.stringify(input) }); },
  update(id: string, input: UpdateFragmentInput) { return request<Fragment>(`${apiPrefix}/fragments/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); },
  remove(id: string) { return request<void>(`${apiPrefix}/fragments/${id}`, { method: 'DELETE' }); },
  async transcribe(audio: Blob, date: string) {
    const form = new FormData();
    form.append('date', date);
    form.append('audio', audio, `fragment.${audio.type.includes('ogg') ? 'ogg' : 'webm'}`);
    const response = await fetch(`${baseUrl}${apiPrefix}/fragments/voice`, { method: 'POST', body: form, credentials: 'include' });
    if (!response.ok) { const body = await response.json().catch(() => ({ error: 'Transcription failed' })); throw new Error(body.error ?? 'Transcription failed'); }
    return response.json() as Promise<Fragment>;
  }
};

const authApi = {
  session() { return request<AuthSession | null>(`${apiPrefix}/auth/session`); },
  signup(input: AuthCredentials) { return request<AuthSession>(`${apiPrefix}/auth/signup`, { method: 'POST', body: JSON.stringify(input) }); },
  login(input: AuthCredentials) { return request<AuthSession>(`${apiPrefix}/auth/login`, { method: 'POST', body: JSON.stringify(input) }); },
  logout() { return request<void>(`${apiPrefix}/auth/logout`, { method: 'POST' }); }
};

// The trial adapter is static-host friendly; the live adapter is used by premium.
export const fragmentsApi = isTrialMode ? demoApi : liveApi;
export { authApi };
