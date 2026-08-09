import Database from 'better-sqlite3';
import type { FragmentRepository, StoredFragment } from '../domain/fragment.js';

type FragmentRow = {
  id: string; title: string | null; content: string; source: 'text'; created_at: string; updated_at: string;
};

export function createSqliteFragmentRepository(filename: string): FragmentRepository {
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

  const toFragment = (row: FragmentRow): StoredFragment => ({
    id: row.id, title: row.title, content: row.content, source: row.source,
    createdAt: row.created_at, updatedAt: row.updated_at
  });
  const insert = database.prepare(`INSERT INTO fragments
    (id, title, content, source, created_at, updated_at)
    VALUES (@id, @title, @content, @source, @createdAt, @updatedAt)`);
  const selectById = database.prepare('SELECT * FROM fragments WHERE id = ?');
  const selectByDate = database.prepare(`SELECT * FROM fragments
    WHERE substr(created_at, 1, 10) = ? ORDER BY created_at ASC`);
  const update = database.prepare(`UPDATE fragments SET title = @title, content = @content,
    updated_at = @updatedAt WHERE id = @id`);
  const remove = database.prepare('DELETE FROM fragments WHERE id = ?');

  return {
    create(fragment) { insert.run(fragment); return fragment; },
    findById(id) { const row = selectById.get(id) as FragmentRow | undefined; return row && toFragment(row); },
    findByDate(date) { return (selectByDate.all(date) as FragmentRow[]).map(toFragment); },
    update(fragment) {
      return update.run(fragment).changes === 1 ? fragment : undefined;
    },
    delete(id) { return remove.run(id).changes === 1; }
  };
}
