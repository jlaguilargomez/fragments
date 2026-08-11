import express from 'express';
import cors from 'cors';
import { createSqliteFragmentRepository } from './infrastructure/sqlite-fragment-repository.js';
import { createFragmentsRouter, handleApiError } from './presentation/fragments-router.js';
import { createAuthRouter, currentUser } from './presentation/auth-router.js';

export function createApp(databaseFilename: string): express.Express {
  const app = express();
  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json());
  const repository = createSqliteFragmentRepository(databaseFilename);
  app.use('/auth', createAuthRouter(repository));
  app.use('/fragments', createFragmentsRouter(repository, request => currentUser(repository, request)));
  app.use(handleApiError);
  return app;
}
