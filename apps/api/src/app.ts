import express from 'express';
import cors from 'cors';
import { createSqliteFragmentRepository } from './infrastructure/sqlite-fragment-repository.js';
import { createFragmentsRouter, handleApiError } from './presentation/fragments-router.js';

export function createApp(databaseFilename: string): express.Express {
  const app = express();
  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json());
  app.use('/fragments', createFragmentsRouter(createSqliteFragmentRepository(databaseFilename)));
  app.use(handleApiError);
  return app;
}
