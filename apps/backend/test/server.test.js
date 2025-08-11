import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import createApp from '../server.js';

describe('Scenes API', () => {
  let app;
  let tempDir;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'scenes-'));
    app = createApp(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('GET /scenes returns default structure', async () => {
    const res = await request(app).get('/scenes');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ schema_version: 1, scenes: [] });
  });

  it('POST /scenes adds new scene', async () => {
    const scene = { id: 1, name: 'Test Scene' };
    const postRes = await request(app).post('/scenes').send(scene);
    expect(postRes.status).toBe(201);
    expect(postRes.body).toEqual(scene);

    const getRes = await request(app).get('/scenes');
    expect(getRes.body.scenes).toEqual([scene]);
    expect(getRes.body.schema_version).toBe(2);
  });
});

describe('Dialogs API', () => {
  let app;
  let tempDir;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'dialogs-'));
    app = createApp(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('GET /dialogs returns default structure', async () => {
    const res = await request(app).get('/dialogs');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ schema_version: 1, dialogs: [] });
  });

  it('POST /dialogs adds new dialog', async () => {
    const dialog = { id: 1, text: 'Hello' };
    const postRes = await request(app).post('/dialogs').send(dialog);
    expect(postRes.status).toBe(201);
    expect(postRes.body).toEqual(dialog);

    const getRes = await request(app).get('/dialogs');
    expect(getRes.body.dialogs).toEqual([dialog]);
    expect(getRes.body.schema_version).toBe(2);
  });
});
