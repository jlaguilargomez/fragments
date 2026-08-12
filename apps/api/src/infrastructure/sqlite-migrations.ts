import type Database from 'better-sqlite3';

type SqliteDatabase = Database.Database;

export function applySqliteMigrations(database: SqliteDatabase): void {
  database.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);

  const applied = database.prepare('SELECT version FROM schema_migrations ORDER BY version').all() as Array<{ version: number }>;
  const versions = new Set(applied.map(row => row.version));

  if (!versions.has(1)) {
    const migration = database.transaction(() => {
      database.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT,
          auth_provider TEXT NOT NULL DEFAULT 'local',
          provider_subject TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          revoked_at TEXT,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions(token_hash);
        CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
      `);
      const columns = database.prepare('PRAGMA table_info(fragments)').all() as Array<{ name: string }>;
      if (columns.length > 0 && !columns.some(column => column.name === 'user_id')) {
        database.exec('ALTER TABLE fragments ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE');
      }
      database.exec('CREATE INDEX IF NOT EXISTS fragments_user_id_created_at_idx ON fragments(user_id, created_at)');
      database.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(1, new Date().toISOString());
    });
    migration();
  }

  if (!versions.has(2)) {
    const migration = database.transaction(() => {
      database.exec(`
        CREATE TABLE fragments_with_voice (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          title TEXT,
          content TEXT NOT NULL,
          source TEXT NOT NULL CHECK (source IN ('text', 'voice')),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        INSERT INTO fragments_with_voice (id, user_id, title, content, source, created_at, updated_at)
          SELECT id, user_id, title, content, source, created_at, updated_at FROM fragments;
        DROP TABLE fragments;
        ALTER TABLE fragments_with_voice RENAME TO fragments;
        CREATE INDEX fragments_created_at_idx ON fragments(created_at);
        CREATE INDEX fragments_user_id_created_at_idx ON fragments(user_id, created_at);
      `);
      database.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(2, new Date().toISOString());
    });
    migration();
  }
}
