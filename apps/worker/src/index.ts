import { z } from 'zod';
import { createFragment, deleteFragment, FragmentNotFoundError, getFragment, getFragmentsForDate, updateFragment } from '@fragments/server-core';
import type { FragmentRepository, StoredFragment } from '@fragments/server-core';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

type FragmentRow = {
  id: string; title: string | null; content: string; source: 'text'; created_at: string; updated_at: string;
};

function createD1FragmentRepository(database: D1Database): FragmentRepository {
  const toFragment = (row: FragmentRow): StoredFragment => ({
    id: row.id, title: row.title, content: row.content, source: row.source,
    createdAt: row.created_at, updatedAt: row.updated_at
  });
  return {
    async create(fragment) {
      await database.prepare(`INSERT INTO fragments
        (id, title, content, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(fragment.id, fragment.title, fragment.content, fragment.source, fragment.createdAt, fragment.updatedAt)
        .run();
      return fragment;
    },
    async findById(id) {
      const result = await database.prepare('SELECT * FROM fragments WHERE id = ?').bind(id).first<FragmentRow>();
      return result ? toFragment(result) : undefined;
    },
    async findByDate(date) {
      const result = await database.prepare(`SELECT * FROM fragments
        WHERE substr(created_at, 1, 10) = ? ORDER BY created_at ASC`).bind(date).all<FragmentRow>();
      return result.results.map(toFragment);
    },
    async update(fragment) {
      const result = await database.prepare(`UPDATE fragments SET title = ?, content = ?, updated_at = ?
        WHERE id = ?`).bind(fragment.title, fragment.content, fragment.updatedAt, fragment.id).run();
      return result.meta.changes === 1 ? fragment : undefined;
    },
    async delete(id) {
      const result = await database.prepare('DELETE FROM fragments WHERE id = ?').bind(id).run();
      return result.meta.changes === 1;
    }
  };
}

const dateSchema = z.iso.date();
const createSchema = z.object({ title: z.string().max(200).nullable().optional(), content: z.string().trim().min(1).max(20_000) });
const updateSchema = z.object({ title: z.string().max(200).nullable().optional(), content: z.string().trim().min(1).max(20_000).optional() }).refine(value => value.title !== undefined || value.content !== undefined, 'At least one field is required');

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/api/health' && request.method === 'GET') return json({ status: 'ok' });
  if (!url.pathname.startsWith('/api/fragments')) return json({ error: 'Not found' }, 404);

  const repository = createD1FragmentRepository(env.DB);
  try {
    const suffix = url.pathname.slice('/api/fragments'.length);
    if (suffix === '' && request.method === 'POST') return json(await createFragment(repository, createSchema.parse(await request.json())), 201);
    if (suffix === '' && request.method === 'GET') return json(await getFragmentsForDate(repository, dateSchema.parse(url.searchParams.get('date'))));
    const id = suffix.slice(1);
    if (!id || id.includes('/')) return json({ error: 'Not found' }, 404);
    if (request.method === 'GET') return json(await getFragment(repository, id));
    if (request.method === 'PATCH') return json(await updateFragment(repository, id, updateSchema.parse(await request.json())));
    if (request.method === 'DELETE') { await deleteFragment(repository, id); return new Response(null, { status: 204 }); }
    return json({ error: 'Method not allowed' }, 405);
  } catch (error) {
    if (error instanceof z.ZodError) return json({ error: 'Invalid request', details: error.issues }, 400);
    if (error instanceof FragmentNotFoundError) return json({ error: error.message }, 404);
    return json({ error: 'Internal server error' }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  }
};
