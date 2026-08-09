import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createApp } from './app.js';

const dataDirectory = resolve(process.cwd(), 'data');
mkdirSync(dataDirectory, { recursive: true });
const app = createApp(resolve(dataDirectory, 'fragments.sqlite'));
// Port 3000 is frequently claimed by local containers and tooling. Keeping the
// MVP API on 3001 avoids accidentally sending journal data to another service.
const port = Number(process.env.PORT ?? 3001);
app.listen(port, '0.0.0.0', () => console.log(`Fragments API listening on http://localhost:${port}`));
