import Database from 'better-sqlite3';
import type { AuthRepository, FragmentRepository, StoredFragment, StoredSession, StoredUser } from '@fragments/server-core';
import { applySqliteMigrations } from './sqlite-migrations.js';

type FragmentRow = { id: string; user_id: string; title: string | null; content: string; source: 'text'; created_at: string; updated_at: string; };
type UserRow = { id: string; email: string; password_hash: string; created_at: string; updated_at: string; };
type SessionRow = { id: string; user_id: string; token_hash: string; expires_at: string; revoked_at: string | null; created_at: string; };

export function createSqliteFragmentRepository(filename: string): FragmentRepository & AuthRepository {
  const database = new Database(filename);
  database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS fragments (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT NOT NULL,
      source TEXT NOT NULL CHECK (source = 'text'),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS fragments_created_at_idx ON fragments(created_at);
  `);
  applySqliteMigrations(database);

  const toFragment = (row: FragmentRow): StoredFragment => ({
    id: row.id, userId: row.user_id, title: row.title, content: row.content, source: row.source,
    createdAt: row.created_at, updatedAt: row.updated_at
  });
  const insert = database.prepare(`INSERT INTO fragments
    (id, user_id, title, content, source, created_at, updated_at)
    VALUES (@id, @userId, @title, @content, @source, @createdAt, @updatedAt)`);
  const selectById = database.prepare('SELECT * FROM fragments WHERE user_id = ? AND id = ?');
  const selectByDate = database.prepare(`SELECT * FROM fragments
    WHERE user_id = ? AND substr(created_at, 1, 10) = ? ORDER BY created_at ASC`);
  const update = database.prepare(`UPDATE fragments SET title = @title, content = @content,
    updated_at = @updatedAt WHERE user_id = @userId AND id = @id`);
  const remove = database.prepare('DELETE FROM fragments WHERE user_id = ? AND id = ?');

  return {
    async create(fragment) { insert.run(fragment); return fragment; },
    async findById(userId, id) { const row = selectById.get(userId, id) as FragmentRow | undefined; return row && toFragment(row); },
    async findByDate(userId, date) { return (selectByDate.all(userId, date) as FragmentRow[]).map(toFragment); },
    async update(userId, fragment) { return update.run({ ...fragment, userId }).changes === 1 ? fragment : undefined; },
    async delete(userId, id) { return remove.run(userId, id).changes === 1; },
    async findUserByEmail(email) { const row = database.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined; return row && { id: row.id, email: row.email, passwordHash: row.password_hash, createdAt: row.created_at, updatedAt: row.updated_at }; },
    async findUserById(id) { const row = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined; return row && { id: row.id, email: row.email, passwordHash: row.password_hash, createdAt: row.created_at, updatedAt: row.updated_at }; },
    async createUser(user: StoredUser) { database.prepare('INSERT INTO users (id, email, password_hash, auth_provider, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(user.id, user.email, user.passwordHash, 'local', user.createdAt, user.updatedAt); return user; },
    async createSession(session: StoredSession) { database.prepare('INSERT INTO sessions (id, user_id, token_hash, expires_at, revoked_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(session.id, session.userId, session.tokenHash, session.expiresAt, session.revokedAt, session.createdAt); return session; },
    async findSessionByTokenHash(tokenHash) { const row = database.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(tokenHash) as SessionRow | undefined; return row && { id: row.id, userId: row.user_id, tokenHash: row.token_hash, expiresAt: row.expires_at, revokedAt: row.revoked_at, createdAt: row.created_at }; },
    async revokeSession(id, revokedAt) { database.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').run(revokedAt, id); }
  };
}
