import express, { Router } from 'express';
import { z } from 'zod';
import { createFragment, createVoiceFragment, deleteFragment, FragmentNotFoundError, getFragment, getFragmentsForDate, updateFragment } from '../application/fragments.js';
import type { VoiceTranscriber } from '@fragments/server-core';
import type { FragmentRepository } from '../domain/fragment.js';

const dateSchema = z.iso.date();
const createSchema = z.object({ title: z.string().max(200_000).nullable().optional(), content: z.string().min(1).max(200_000), date: z.iso.date() });
const updateSchema = z.object({ title: z.string().max(200_000).nullable().optional(), content: z.string().min(1).max(200_000).optional() }).refine(value => value.title !== undefined || value.content !== undefined, 'At least one field is required');
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const voiceDateSchema = z.object({ date: z.iso.date() });

export function createFragmentsRouter(repository: FragmentRepository, requireUser: (request: { headers: { cookie?: string } }) => Promise<{ id: string }>, transcriber?: VoiceTranscriber): Router {
  const router = Router();
  router.post('/voice', expressRawAudio, async (request, response, next) => {
    try {
      const user = await requireUser(request);
      if (!transcriber) throw new VoiceUnavailableError();
      const contentType = request.headers['content-type'] ?? '';
      const parsed = parseMultipartAudio(request.body as Buffer, contentType);
      const date = voiceDateSchema.parse({ date: parsed.date }).date;
      const audioBuffer = new ArrayBuffer(parsed.audio.byteLength);
      new Uint8Array(audioBuffer).set(parsed.audio);
      const text = (await transcriber.transcribe(audioBuffer, parsed.mimeType)).trim();
      if (!text) throw new VoiceTranscriptionError('No speech was detected.');
      response.status(201).json(await createVoiceFragment(repository, user.id, { date, content: text }));
    } catch (error) { next(error); }
  });
  router.post('/', async (request, response, next) => {
    try { response.status(201).json(await createFragment(repository, (await requireUser(request)).id, createSchema.parse(request.body))); } catch (error) { next(error); }
  });
  router.get('/', async (request, response, next) => {
    try { response.json(await getFragmentsForDate(repository, (await requireUser(request)).id, dateSchema.parse(request.query.date))); } catch (error) { next(error); }
  });
  router.get('/:id', async (request, response, next) => {
    try { response.json(await getFragment(repository, (await requireUser(request)).id, request.params.id)); } catch (error) { next(error); }
  });
  router.patch('/:id', async (request, response, next) => {
    try { response.json(await updateFragment(repository, (await requireUser(request)).id, request.params.id, updateSchema.parse(request.body))); } catch (error) { next(error); }
  });
  router.delete('/:id', async (request, response, next) => {
    try { await deleteFragment(repository, (await requireUser(request)).id, request.params.id); response.status(204).send(); } catch (error) { next(error); }
  });
  return router;
}

const expressRawAudio = express.raw({ type: 'multipart/form-data', limit: MAX_AUDIO_BYTES + 128 * 1024 });

class VoiceUnavailableError extends Error { status = 503; constructor() { super('Voice transcription is unavailable in the local API.'); } }
class VoiceTranscriptionError extends Error { status = 422; }

function parseMultipartAudio(body: Buffer, contentType: string): { audio: Buffer; mimeType: string; date: string } {
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)?.[1] ?? /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType)?.[2];
  if (!boundary || body.length === 0 || body.length > MAX_AUDIO_BYTES + 128 * 1024) throw new VoiceRequestError('Audio is missing or too large.');
  const delimiter = Buffer.from(`--${boundary}`);
  const parts: Array<{ headers: string; content: Buffer }> = [];
  let cursor = body.indexOf(delimiter);
  while (cursor !== -1) {
    const start = cursor + delimiter.length;
    if (body.subarray(start, start + 2).toString() === '--') break;
    const contentStart = body.subarray(start, start + 2).toString() === '\r\n' ? start + 2 : start;
    const next = body.indexOf(delimiter, contentStart);
    if (next === -1) break;
    const part = body.subarray(contentStart, next - 2);
    const separator = part.indexOf(Buffer.from('\r\n\r\n'));
    if (separator !== -1) parts.push({ headers: part.subarray(0, separator).toString('utf8'), content: part.subarray(separator + 4) });
    cursor = next;
  }
  let date = '';
  let audio: Buffer | undefined;
  let mimeType = '';
  for (const part of parts) {
    const disposition = /content-disposition:[^\r\n]*;\s*name="([^"]+)"/i.exec(part.headers);
    if (!disposition) continue;
    if (disposition[1] === 'date') date = part.content.toString('utf8').trim();
    if (disposition[1] === 'audio' && /;\s*filename=/i.test(part.headers)) {
      audio = part.content;
      mimeType = /content-type:\s*([^\r\n]+)/i.exec(part.headers)?.[1]?.trim() ?? 'application/octet-stream';
    }
  }
  if (!audio || audio.length === 0) throw new VoiceRequestError('Audio is missing.');
  if (!/^audio\/(webm|ogg|wav|mpeg|mp4|mp4a-latm)$|^application\/octet-stream$/i.test(mimeType)) throw new VoiceRequestError('Unsupported audio format.');
  return { audio, mimeType, date };
}

class VoiceRequestError extends Error { status = 400; }

export function handleApiError(error: unknown, _request: unknown, response: { status: (code: number) => { json: (body: unknown) => void } }, _next: unknown): void {
  if (error instanceof z.ZodError) {
    response.status(400).json({ error: 'Invalid request', details: error.issues });
    return;
  }
  if (error instanceof FragmentNotFoundError) { response.status(404).json({ error: error.message }); return; }
  if (error instanceof VoiceRequestError || error instanceof VoiceTranscriptionError || error instanceof VoiceUnavailableError) { response.status(error.status).json({ error: error.message }); return; }
  if (error instanceof Error && (error as Error & { status?: number }).status === 401) { response.status(401).json({ error: error.message }); return; }
  response.status(500).json({ error: 'Internal server error' });
}
