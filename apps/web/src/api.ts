import type { AuthCredentials, AuthSession, CreateFragmentInput, Fragment, UpdateFragmentInput } from '@fragments/shared';

const baseUrl = import.meta.env.VITE_API_URL ?? '';
const apiPrefix = baseUrl ? '' : (import.meta.env.DEV ? '' : '/api');
export const isVisualDemo = import.meta.env.VITE_VISUAL_DEMO === 'true';

const demoFragments: Fragment[] = [
  {
    id: 'demo-morning-walk',
    title: 'Morning walk',
    content: 'Marco stopped to look at a ladybug on the way to school. He said it was wearing a tiny red coat.',
    source: 'text',
    createdAt: new Date().toISOString().replace(/T.*/, 'T08:42:00.000Z'),
    updatedAt: new Date().toISOString().replace(/T.*/, 'T08:42:00.000Z')
  },
  {
    id: 'demo-idea',
    title: 'A small idea',
    content: 'Make room for thoughts before asking them to become useful.',
    source: 'text',
    createdAt: new Date().toISOString().replace(/T.*/, 'T11:16:00.000Z'),
    updatedAt: new Date().toISOString().replace(/T.*/, 'T11:16:00.000Z')
  }
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const demoApi = {
  list(date: string) { return Promise.resolve(date === today() ? [...demoFragments] : []); },
  create(input: CreateFragmentInput) {
    const now = new Date().toISOString();
    const fragment: Fragment = { id: crypto.randomUUID(), title: input.title?.trim() || null, content: input.content.trim(), source: 'text', createdAt: `${input.date}T${now.slice(11)}`, updatedAt: now };
    demoFragments.push(fragment);
    return Promise.resolve(fragment);
  },
  update(id: string, input: UpdateFragmentInput) {
    const fragment = demoFragments.find((candidate) => candidate.id === id);
    if (!fragment) return Promise.reject(new Error('Fragment not found'));
    if (input.title !== undefined) fragment.title = input.title?.trim() || null;
    if (input.content !== undefined) fragment.content = input.content.trim();
    fragment.updatedAt = new Date().toISOString();
    return Promise.resolve(fragment);
  },
  remove(id: string) {
    const index = demoFragments.findIndex((fragment) => fragment.id === id);
    if (index === -1) return Promise.reject(new Error('Fragment not found'));
    demoFragments.splice(index, 1);
    return Promise.resolve();
  },
  transcribe(_audio: Blob, date: string) {
    const now = new Date().toISOString();
    const fragment: Fragment = { id: crypto.randomUUID(), title: null, content: 'A voice fragment from the visual demo.', source: 'voice', createdAt: `${date}T${now.slice(11)}`, updatedAt: now };
    demoFragments.push(fragment);
    return Promise.resolve(fragment);
  }
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

// GitHub Pages can only host static files. Its demo keeps interactions useful
// in the current tab, without pretending that entries are durably stored.
export const fragmentsApi = isVisualDemo ? demoApi : liveApi;
export { authApi };
