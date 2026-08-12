import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

describe('Fragments API', () => {
  const apps: ReturnType<typeof createApp>[] = [];
  afterEach(() => { apps.length = 0; });
  const app = () => { const instance = createApp(':memory:'); apps.push(instance); return instance; };
  async function authenticated(api: ReturnType<typeof createApp>, email = 'one@example.com') {
    const response = await request(api).post('/auth/signup').send({ email, password: 'a secure password' }).expect(201);
    return response.headers['set-cookie'][0].split(';')[0];
  }

  it('creates and lists a fragment for its day', async () => {
    const api = app(); const cookie = await authenticated(api);
    const created = await request(api).post('/fragments').set('Cookie', cookie).send({ title: 'A thought', content: 'Something worth keeping.', date: new Date().toISOString().slice(0, 10) }).expect(201);
    const date = created.body.createdAt.slice(0, 10);
    const listed = await request(api).get(`/fragments?date=${date}`).set('Cookie', cookie).expect(200);
    expect(listed.body).toHaveLength(1); expect(listed.body[0].id).toBe(created.body.id);
  });

  it('creates a fragment for the selected day instead of the current day', async () => {
    const api = app(); const cookie = await authenticated(api);
    const selectedDate = '2026-01-15';
    const created = await request(api).post('/fragments').set('Cookie', cookie)
      .send({ content: 'A backdated thought.', date: selectedDate }).expect(201);

    expect(created.body.createdAt.slice(0, 10)).toBe(selectedDate);
    expect((await request(api).get(`/fragments?date=${selectedDate}`).set('Cookie', cookie)).body).toHaveLength(1);
    expect((await request(api).get(`/fragments?date=${new Date().toISOString().slice(0, 10)}`).set('Cookie', cookie)).body).toHaveLength(0);
  });

  it('requires authentication and isolates fragments by user', async () => {
    const api = app(); const first = await authenticated(api); const second = await authenticated(api, 'two@example.com');
    await request(api).get('/fragments?date=2026-01-01').expect(401);
    const created = await request(api).post('/fragments').set('Cookie', first).send({ content: 'Private thought.', date: new Date().toISOString().slice(0, 10) }).expect(201);
    await request(api).get(`/fragments/${created.body.id}`).set('Cookie', second).expect(404);
    await request(api).patch(`/fragments/${created.body.id}`).set('Cookie', second).send({ content: 'No access.' }).expect(404);
    await request(api).delete(`/fragments/${created.body.id}`).set('Cookie', second).expect(404);
  });

  it('supports session restoration and logout', async () => {
    const api = app(); const cookie = await authenticated(api, 'user@example.com');
    expect((await request(api).get('/auth/session').set('Cookie', cookie)).body.user.email).toBe('user@example.com');
    await request(api).post('/auth/logout').set('Cookie', cookie).expect(204);
    expect((await request(api).get('/auth/session').set('Cookie', cookie)).body).toBeNull();
  });

  it('validates credentials and reports duplicate accounts', async () => {
    const api = app();
    await request(api).post('/auth/signup').send({ email: 'short@example.com', password: 'short' }).expect(400);
    await request(api).post('/auth/signup').send({ email: 'user@example.com', password: 'a secure password' }).expect(201);
    await request(api).post('/auth/signup').send({ email: 'USER@example.com', password: 'a secure password' }).expect(409);
    await request(api).post('/auth/login').send({ email: 'user@example.com', password: 'wrong password' }).expect(401);
  });

  it('transcribes an authenticated audio upload into a voice fragment', async () => {
    const transcriber = { transcribe: async (audio: ArrayBuffer, mimeType: string) => { expect(audio.byteLength).toBeGreaterThan(0); expect(mimeType).toBe('audio/webm'); return 'A spoken thought.'; } };
    const api = createApp(':memory:', transcriber); apps.push(api);
    const cookie = await authenticated(api, 'voice@example.com');
    const date = '2026-02-03';
    const created = await request(api).post('/fragments/voice').set('Cookie', cookie)
      .field('date', date).attach('audio', Buffer.from('fake audio'), { filename: 'fragment.webm', contentType: 'audio/webm' }).expect(201);

    expect(created.body.source).toBe('voice');
    expect(created.body.title).toBeNull();
    expect(created.body.content).toBe('A spoken thought.');
    expect((await request(api).get(`/fragments?date=${date}`).set('Cookie', cookie)).body[0].id).toBe(created.body.id);
  });

  it('rejects voice uploads without authentication and with an unsupported format', async () => {
    const api = createApp(':memory:', { transcribe: async () => 'not used' }); apps.push(api);
    await request(api).post('/fragments/voice').field('date', '2026-02-03')
      .attach('audio', Buffer.from('fake audio'), { filename: 'fragment.txt', contentType: 'text/plain' }).expect(401);
    const cookie = await authenticated(api, 'invalid-voice@example.com');
    await request(api).post('/fragments/voice').set('Cookie', cookie).field('date', '2026-02-03')
      .attach('audio', Buffer.from('fake audio'), { filename: 'fragment.txt', contentType: 'text/plain' }).expect(400);
  });
});
