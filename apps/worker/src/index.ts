import { z } from 'zod';
import { createFragment, createVoiceFragment, deleteFragment, FragmentNotFoundError, getFragment, getFragmentsForDate, getSession, InvalidCredentialsError, login, logout, signUp, updateFragment } from '@fragments/server-core';
import type { AuthRepository, FragmentRepository, StoredFragment, StoredSession, StoredUser } from '@fragments/server-core';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  AI: Ai;
  SIGNUP_INVITE_CODE?: string;
}

type FragmentRow = {
  id: string; user_id: string; title: string | null; content: string; source: 'text' | 'voice'; created_at: string; updated_at: string;
};
type UserRow = { id: string; email: string; password_hash: string; created_at: string; updated_at: string };
type SessionRow = { id: string; user_id: string; token_hash: string; expires_at: string; revoked_at: string | null; created_at: string };

function createD1FragmentRepository(database: D1Database): FragmentRepository & AuthRepository {
  const toFragment = (row: FragmentRow): StoredFragment => ({
    id: row.id, userId: row.user_id, title: row.title, content: row.content, source: row.source,
    createdAt: row.created_at, updatedAt: row.updated_at
  });
  return {
    async create(fragment) {
      await database.prepare(`INSERT INTO fragments
        (id, user_id, title, content, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(fragment.id, fragment.userId, fragment.title, fragment.content, fragment.source, fragment.createdAt, fragment.updatedAt)
        .run();
      return fragment;
    },
    async findById(userId, id) {
      const result = await database.prepare('SELECT * FROM fragments WHERE user_id = ? AND id = ?').bind(userId, id).first<FragmentRow>();
      return result ? toFragment(result) : undefined;
    },
    async findByDate(userId, date) {
      const result = await database.prepare(`SELECT * FROM fragments
        WHERE user_id = ? AND substr(created_at, 1, 10) = ? ORDER BY created_at ASC`).bind(userId, date).all<FragmentRow>();
      return result.results.map(toFragment);
    },
    async update(userId, fragment) {
      const result = await database.prepare(`UPDATE fragments SET title = ?, content = ?, updated_at = ?
        WHERE user_id = ? AND id = ?`).bind(fragment.title, fragment.content, fragment.updatedAt, userId, fragment.id).run();
      return result.meta.changes === 1 ? fragment : undefined;
    },
    async delete(userId, id) {
      const result = await database.prepare('DELETE FROM fragments WHERE user_id = ? AND id = ?').bind(userId, id).run();
      return result.meta.changes === 1;
    },
    async findUserByEmail(email) { const row = await database.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>(); return row ? { id: row.id, email: row.email, passwordHash: row.password_hash, createdAt: row.created_at, updatedAt: row.updated_at } : undefined; },
    async findUserById(id) { const row = await database.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>(); return row ? { id: row.id, email: row.email, passwordHash: row.password_hash, createdAt: row.created_at, updatedAt: row.updated_at } : undefined; },
    async createUser(user: StoredUser) { await database.prepare('INSERT INTO users (id, email, password_hash, auth_provider, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(user.id, user.email, user.passwordHash, 'local', user.createdAt, user.updatedAt).run(); return user; },
    async createSession(session: StoredSession) { await database.prepare('INSERT INTO sessions (id, user_id, token_hash, expires_at, revoked_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(session.id, session.userId, session.tokenHash, session.expiresAt, session.revokedAt, session.createdAt).run(); return session; },
    async findSessionByTokenHash(tokenHash) { const row = await database.prepare('SELECT * FROM sessions WHERE token_hash = ?').bind(tokenHash).first<SessionRow>(); return row ? { id: row.id, userId: row.user_id, tokenHash: row.token_hash, expiresAt: row.expires_at, revokedAt: row.revoked_at, createdAt: row.created_at } : undefined; },
    async revokeSession(id, revokedAt) { await database.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').bind(revokedAt, id).run(); }
  };
}

const dateSchema = z.iso.date();
const createSchema = z.object({ title: z.string().max(200_000).nullable().optional(), content: z.string().min(1).max(200_000), date: z.iso.date() });
const updateSchema = z.object({ title: z.string().max(200_000).nullable().optional(), content: z.string().min(1).max(200_000).optional() }).refine(value => value.title !== undefined || value.content !== undefined, 'At least one field is required');
const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(12), inviteCode: z.string().optional() });
const voiceDateSchema = z.object({ date: z.iso.date() });
const COOKIE = 'fragments_session';
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/api/health' && request.method === 'GET') return json({ status: 'ok' });
  if (!url.pathname.startsWith('/api/fragments') && !url.pathname.startsWith('/api/auth')) return json({ error: 'Not found' }, 404);

  const repository = createD1FragmentRepository(env.DB);
  try {
    if (url.pathname === '/api/auth/signup' && request.method === 'POST') {
      const credentials = credentialsSchema.parse(await request.json());
      if (env.SIGNUP_INVITE_CODE && credentials.inviteCode !== env.SIGNUP_INVITE_CODE) return json({ error: 'Invalid invitation code' }, 403);
      const result = await signUp(repository, credentials); return withCookie(json(result.session, 201), result.token);
    }
    if (url.pathname === '/api/auth/login' && request.method === 'POST') { const result = await login(repository, credentialsSchema.parse(await request.json())); return withCookie(json(result.session), result.token); }
    if (url.pathname === '/api/auth/session' && request.method === 'GET') { const session = await getSession(repository, cookieFrom(request)); return json(session ?? null); }
    if (url.pathname === '/api/auth/logout' && request.method === 'POST') { await logout(repository, cookieFrom(request)); return clearCookie(new Response(null, { status: 204 })); }
    const suffix = url.pathname.slice('/api/fragments'.length);
    const session = await getSession(repository, cookieFrom(request));
    if (!session) return json({ error: 'Authentication required' }, 401);
    if (suffix === '/voice' && request.method === 'POST') {
      const form = await request.formData();
      const date = voiceDateSchema.parse({ date: form.get('date') }).date;
      const audio = form.get('audio');
      if (!(audio instanceof File) || audio.size === 0) return json({ error: 'Audio is missing.' }, 400);
      if (audio.size > MAX_AUDIO_BYTES) return json({ error: 'Audio is too large.' }, 400);
      if (!audio.type.startsWith('audio/') && audio.type !== 'application/octet-stream') return json({ error: 'Unsupported audio format.' }, 400);
      const result = await env.AI.run('@cf/openai/whisper', { audio: Array.from(new Uint8Array(await audio.arrayBuffer())) });
      const content = result.text.trim();
      if (!content) return json({ error: 'No speech was detected.' }, 422);
      return json(await createVoiceFragment(repository, session.user.id, { date, content }), 201);
    }
    if (suffix === '' && request.method === 'POST') return json(await createFragment(repository, session.user.id, createSchema.parse(await request.json())), 201);
    if (suffix === '' && request.method === 'GET') return json(await getFragmentsForDate(repository, session.user.id, dateSchema.parse(url.searchParams.get('date'))));
    const id = suffix.slice(1);
    if (!id || id.includes('/')) return json({ error: 'Not found' }, 404);
    if (request.method === 'GET') return json(await getFragment(repository, session.user.id, id));
    if (request.method === 'PATCH') return json(await updateFragment(repository, session.user.id, id, updateSchema.parse(await request.json())));
    if (request.method === 'DELETE') { await deleteFragment(repository, session.user.id, id); return new Response(null, { status: 204 }); }
    return json({ error: 'Method not allowed' }, 405);
  } catch (error) {
    if (error instanceof z.ZodError) return json({ error: 'Invalid request', details: error.issues }, 400);
    if (error instanceof FragmentNotFoundError) return json({ error: error.message }, 404);
    if (error instanceof InvalidCredentialsError) return json({ error: error.message }, 401);
    if (isUniqueError(error)) return json({ error: 'An account with that email already exists' }, 409);
    return json({ error: 'Internal server error' }, 500);
  }
}

function cookieFrom(request: Request): string | undefined { return request.headers.get('Cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1); }
function withCookie(response: Response, token: string): Response { response.headers.append('Set-Cookie', `${COOKIE}=${token}; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax; Secure`); return response; }
function clearCookie(response: Response): Response { response.headers.append('Set-Cookie', `${COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure`); return response; }
function isUniqueError(error: unknown): boolean { return error instanceof Error && /unique|constraint/i.test(error.message); }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  }
};
