import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  display_name TEXT NOT NULL DEFAULT '',
  height_cm REAL,
  weight_kg REAL,
  notes TEXT,
  goal_title TEXT,
  goal_target_weight REAL,
  goal_note TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workout_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS template_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER REFERENCES workout_templates(id) ON DELETE SET NULL,
  title TEXT,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS session_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id INTEGER NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  set_index INTEGER NOT NULL,
  reps INTEGER,
  weight_kg REAL
);

CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON template_exercises(template_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise ON sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export async function migrate(db: SQLiteDatabase) {
  await db.execAsync(SCHEMA);
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM profile WHERE id = 1"
  );
  if (row && row.c === 0) {
    await db.runAsync(
      "INSERT INTO profile (id, display_name) VALUES (1, ?)",
      'Athlet'
    );
  }

  // v2: add sets_count and reps to template_exercises
  const cols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(template_exercises)"
  );
  const colNames = cols.map((c) => c.name);
  if (!colNames.includes('sets_count')) {
    await db.execAsync('ALTER TABLE template_exercises ADD COLUMN sets_count INTEGER');
  }
  if (!colNames.includes('reps')) {
    await db.execAsync("ALTER TABLE template_exercises ADD COLUMN reps TEXT");
  }

  // v3: single goal lives on the profile row (replaces the old multi-goal table)
  const profileCols = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(profile)"
  );
  const profileColNames = profileCols.map((c) => c.name);
  if (!profileColNames.includes('goal_title')) {
    await db.execAsync('ALTER TABLE profile ADD COLUMN goal_title TEXT');
  }
  if (!profileColNames.includes('goal_target_weight')) {
    await db.execAsync('ALTER TABLE profile ADD COLUMN goal_target_weight REAL');
  }
  if (!profileColNames.includes('goal_note')) {
    await db.execAsync('ALTER TABLE profile ADD COLUMN goal_note TEXT');
  }
}
