import express from 'express';
import cors from 'cors';
import { createSqliteFragmentRepository } from './infrastructure/sqlite-fragment-repository.js';
import { createFragmentsRouter, handleApiError } from './presentation/fragments-router.js';
import type { VoiceTranscriber } from '@fragments/server-core';
import { createAuthRouter, currentUser } from './presentation/auth-router.js';

export function createApp(databaseFilename: string, transcriber?: VoiceTranscriber): express.Express {
  const app = express();
  // Vite may choose the next available port when another local app owns 5173.
  // Reflect the requesting origin by default for local development, while
  // allowing a deployment to pin an explicit origin through WEB_ORIGIN.
  app.use(cors({ origin: process.env.WEB_ORIGIN ?? true }));
  app.use(express.json());
  const repository = createSqliteFragmentRepository(databaseFilename);
  app.use('/auth', createAuthRouter(repository));
  app.use('/fragments', createFragmentsRouter(repository, request => currentUser(repository, request), transcriber));
  app.use(handleApiError);
  return app;
}
