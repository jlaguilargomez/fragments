import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

describe('Fragments API', () => {
  const apps: ReturnType<typeof createApp>[] = [];
  afterEach(() => { apps.length = 0; });
  const app = () => { const instance = createApp(':memory:'); apps.push(instance); return instance; };

  it('creates and lists a fragment for its day', async () => {
    const api = app();
    const created = await request(api).post('/fragments').send({ title: 'A thought', content: 'Something worth keeping.' }).expect(201);
    expect(created.body.title).toBe('A thought');
    const date = created.body.createdAt.slice(0, 10);
    const listed = await request(api).get(`/fragments?date=${date}`).expect(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].id).toBe(created.body.id);
  });

  it('validates content and reports missing fragments', async () => {
    const api = app();
    await request(api).post('/fragments').send({ content: '   ' }).expect(400);
    await request(api).get('/fragments/missing').expect(404);
  });
});
