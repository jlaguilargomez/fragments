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
