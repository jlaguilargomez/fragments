import { Router } from 'express';
import { z } from 'zod';
import { createFragment, deleteFragment, FragmentNotFoundError, getFragment, getFragmentsForDate, updateFragment } from '../application/fragments.js';
import type { FragmentRepository } from '../domain/fragment.js';

const dateSchema = z.iso.date();
const createSchema = z.object({ title: z.string().max(200).nullable().optional(), content: z.string().trim().min(1).max(20_000) });
const updateSchema = z.object({ title: z.string().max(200).nullable().optional(), content: z.string().trim().min(1).max(20_000).optional() }).refine(value => value.title !== undefined || value.content !== undefined, 'At least one field is required');

export function createFragmentsRouter(repository: FragmentRepository): Router {
  const router = Router();
  router.post('/', async (request, response, next) => {
    try { response.status(201).json(await createFragment(repository, createSchema.parse(request.body))); } catch (error) { next(error); }
  });
  router.get('/', async (request, response, next) => {
    try { response.json(await getFragmentsForDate(repository, dateSchema.parse(request.query.date))); } catch (error) { next(error); }
  });
  router.get('/:id', async (request, response, next) => {
    try { response.json(await getFragment(repository, request.params.id)); } catch (error) { next(error); }
  });
  router.patch('/:id', async (request, response, next) => {
    try { response.json(await updateFragment(repository, request.params.id, updateSchema.parse(request.body))); } catch (error) { next(error); }
  });
  router.delete('/:id', async (request, response, next) => {
    try { await deleteFragment(repository, request.params.id); response.status(204).send(); } catch (error) { next(error); }
  });
  return router;
}

export function handleApiError(error: unknown, _request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }, _next: unknown): void {
  if (error instanceof z.ZodError) {
    response.status(400).json({ error: 'Invalid request', details: error.issues });
    return;
  }
  if (error instanceof FragmentNotFoundError) { response.status(404).json({ error: error.message }); return; }
  response.status(500).json({ error: 'Internal server error' });
}
