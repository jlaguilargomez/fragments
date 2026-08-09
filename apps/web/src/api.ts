import type { CreateFragmentInput, Fragment, UpdateFragmentInput } from '@fragments/shared';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
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
    const fragment: Fragment = { id: crypto.randomUUID(), title: input.title?.trim() || null, content: input.content.trim(), source: 'text', createdAt: now, updatedAt: now };
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
  }
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error ?? 'Request failed');
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

const liveApi = {
  list(date: string) { return request<Fragment[]>(`/fragments?date=${date}`); },
  create(input: CreateFragmentInput) { return request<Fragment>('/fragments', { method: 'POST', body: JSON.stringify(input) }); },
  update(id: string, input: UpdateFragmentInput) { return request<Fragment>(`/fragments/${id}`, { method: 'PATCH', body: JSON.stringify(input) }); },
  remove(id: string) { return request<void>(`/fragments/${id}`, { method: 'DELETE' }); }
};

// GitHub Pages can only host static files. Its demo keeps interactions useful
// in the current tab, without pretending that entries are durably stored.
export const fragmentsApi = isVisualDemo ? demoApi : liveApi;
