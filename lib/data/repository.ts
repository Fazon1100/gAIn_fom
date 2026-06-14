import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  BodyWeight,
  ChatMessage,
  Profile,
  ProgressWeek,
  SessionExercise,
  SessionRow,
  SetRow,
  TemplateExercise,
  WorkoutTemplate,
} from './types';

function mapProfile(r: Record<string, unknown>): Profile {
  return {
    id: Number(r.id),
    displayName: String(r.display_name),
    heightCm: r.height_cm == null ? null : Number(r.height_cm),
    weightKg: r.weight_kg == null ? null : Number(r.weight_kg),
    notes: r.notes == null ? null : String(r.notes),
    goalTitle: r.goal_title == null ? null : String(r.goal_title),
    goalTargetWeight: r.goal_target_weight == null ? null : Number(r.goal_target_weight),
    goalNote: r.goal_note == null ? null : String(r.goal_note),
    updatedAt: String(r.updated_at),
  };
}

export async function getProfile(db: SQLiteDatabase): Promise<Profile> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM profile WHERE id = 1'
  );
  if (!row) throw new Error('Profil fehlt');
  return mapProfile(row);
}

export async function saveProfile(
  db: SQLiteDatabase,
  p: Pick<Profile, 'displayName' | 'heightCm' | 'weightKg' | 'notes'>
) {
  await db.runAsync(
    `UPDATE profile SET display_name = ?, height_cm = ?, weight_kg = ?, notes = ?, updated_at = datetime('now') WHERE id = 1`,
    p.displayName,
    p.heightCm,
    p.weightKg,
    p.notes
  );
}

/** Speichert das (einzige) Fitnessziel direkt auf der Profil-Zeile. */
export async function saveGoal(
  db: SQLiteDatabase,
  g: { title: string | null; targetWeight: number | null; note: string | null }
) {
  await db.runAsync(
    `UPDATE profile SET goal_title = ?, goal_target_weight = ?, goal_note = ?, updated_at = datetime('now') WHERE id = 1`,
    g.title,
    g.targetWeight,
    g.note
  );
}

export async function listTemplates(db: SQLiteDatabase): Promise<WorkoutTemplate[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM workout_templates ORDER BY created_at DESC'
  );
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    createdAt: String(r.created_at),
  }));
}

export async function createTemplate(db: SQLiteDatabase, name: string): Promise<number> {
  const res = await db.runAsync(
    'INSERT INTO workout_templates (name) VALUES (?)',
    name
  );
  return Number(res.lastInsertRowId);
}

export async function renameTemplate(db: SQLiteDatabase, id: number, name: string) {
  await db.runAsync('UPDATE workout_templates SET name = ? WHERE id = ?', name, id);
}

export async function deleteTemplate(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM workout_templates WHERE id = ?', id);
}

export async function listTemplateExercises(
  db: SQLiteDatabase,
  templateId: number
): Promise<TemplateExercise[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM template_exercises WHERE template_id = ? ORDER BY sort_order ASC',
    templateId
  );
  return rows.map((r) => ({
    id: Number(r.id),
    templateId: Number(r.template_id),
    name: String(r.name),
    sortOrder: Number(r.sort_order),
    notes: r.notes == null ? null : String(r.notes),
    setsCount: r.sets_count == null ? null : Number(r.sets_count),
    reps: r.reps == null ? null : String(r.reps),
  }));
}

export async function addTemplateExercise(
  db: SQLiteDatabase,
  templateId: number,
  name: string,
  notes: string | null,
  setsCount: number | null = null,
  reps: string | null = null
) {
  const row = await db.getFirstAsync<{ m: number }>(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 as m FROM template_exercises WHERE template_id = ?',
    templateId
  );
  const next = row?.m ?? 0;
  await db.runAsync(
    'INSERT INTO template_exercises (template_id, name, sort_order, notes, sets_count, reps) VALUES (?, ?, ?, ?, ?, ?)',
    templateId,
    name,
    next,
    notes,
    setsCount,
    reps
  );
}

export async function updateTemplateExerciseSetsReps(
  db: SQLiteDatabase,
  exerciseId: number,
  setsCount: number | null,
  reps: string | null
) {
  await db.runAsync(
    'UPDATE template_exercises SET sets_count = ?, reps = ? WHERE id = ?',
    setsCount,
    reps,
    exerciseId
  );
}

export async function deleteTemplateExercise(db: SQLiteDatabase, exerciseId: number) {
  await db.runAsync('DELETE FROM template_exercises WHERE id = ?', exerciseId);
}

export async function getInProgressSession(db: SQLiteDatabase): Promise<SessionRow | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM sessions WHERE status = 'in_progress' ORDER BY started_at DESC LIMIT 1"
  );
  if (!row) return null;
  return {
    id: Number(row.id),
    templateId: row.template_id == null ? null : Number(row.template_id),
    title: row.title == null ? null : String(row.title),
    status: row.status as SessionRow['status'],
    startedAt: String(row.started_at),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
  };
}

export async function createSessionFromTemplate(
  db: SQLiteDatabase,
  templateId: number,
  templateName: string
): Promise<number> {
  const res = await db.runAsync(
    "INSERT INTO sessions (template_id, title, status) VALUES (?, ?, 'in_progress')",
    templateId,
    templateName
  );
  const sessionId = Number(res.lastInsertRowId);
  const exercises = await listTemplateExercises(db, templateId);
  for (const ex of exercises) {
    const exerciseId = await addSessionExercise(db, sessionId, ex.name);
    const numSets = ex.setsCount ?? 1;
    for (let i = 0; i < numSets; i++) {
      await addSet(db, exerciseId);
    }
  }
  return sessionId;
}

export async function addSessionExercise(
  db: SQLiteDatabase,
  sessionId: number,
  name: string
): Promise<number> {
  const row = await db.getFirstAsync<{ m: number }>(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 as m FROM session_exercises WHERE session_id = ?',
    sessionId
  );
  const next = row?.m ?? 0;
  const res = await db.runAsync(
    'INSERT INTO session_exercises (session_id, name, sort_order) VALUES (?, ?, ?)',
    sessionId,
    name,
    next
  );
  return Number(res.lastInsertRowId);
}

export async function listSessionExercises(
  db: SQLiteDatabase,
  sessionId: number
): Promise<SessionExercise[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM session_exercises WHERE session_id = ? ORDER BY sort_order ASC',
    sessionId
  );
  return rows.map((r) => ({
    id: Number(r.id),
    sessionId: Number(r.session_id),
    name: String(r.name),
    sortOrder: Number(r.sort_order),
  }));
}

export async function deleteSessionExercise(db: SQLiteDatabase, exerciseId: number) {
  await db.runAsync('DELETE FROM session_exercises WHERE id = ?', exerciseId);
}

export async function listSets(db: SQLiteDatabase, exerciseId: number): Promise<SetRow[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM sets WHERE exercise_id = ? ORDER BY set_index ASC',
    exerciseId
  );
  return rows.map((r) => ({
    id: Number(r.id),
    exerciseId: Number(r.exercise_id),
    setIndex: Number(r.set_index),
    reps: r.reps == null ? null : Number(r.reps),
    weightKg: r.weight_kg == null ? null : Number(r.weight_kg),
  }));
}

export async function addSet(db: SQLiteDatabase, exerciseId: number): Promise<number> {
  const row = await db.getFirstAsync<{ m: number }>(
    'SELECT COALESCE(MAX(set_index), -1) + 1 as m FROM sets WHERE exercise_id = ?',
    exerciseId
  );
  const next = row?.m ?? 0;
  const res = await db.runAsync(
    'INSERT INTO sets (exercise_id, set_index, reps, weight_kg) VALUES (?, ?, NULL, NULL)',
    exerciseId,
    next
  );
  return Number(res.lastInsertRowId);
}

export async function updateSet(
  db: SQLiteDatabase,
  setId: number,
  reps: number | null,
  weightKg: number | null
) {
  await db.runAsync('UPDATE sets SET reps = ?, weight_kg = ? WHERE id = ?', reps, weightKg, setId);
}

export async function deleteSet(db: SQLiteDatabase, setId: number) {
  await db.runAsync('DELETE FROM sets WHERE id = ?', setId);
}

export async function completeSession(db: SQLiteDatabase, sessionId: number) {
  await db.runAsync(
    "UPDATE sessions SET status = 'completed', completed_at = datetime('now') WHERE id = ?",
    sessionId
  );
}

export async function abandonSession(db: SQLiteDatabase, sessionId: number) {
  await db.runAsync('DELETE FROM sessions WHERE id = ?', sessionId);
}

export async function deleteSession(db: SQLiteDatabase, sessionId: number) {
  await db.runAsync('DELETE FROM sessions WHERE id = ?', sessionId);
}

export async function getSession(db: SQLiteDatabase, sessionId: number): Promise<SessionRow | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM sessions WHERE id = ?',
    sessionId
  );
  if (!row) return null;
  return {
    id: Number(row.id),
    templateId: row.template_id == null ? null : Number(row.template_id),
    title: row.title == null ? null : String(row.title),
    status: row.status as SessionRow['status'],
    startedAt: String(row.started_at),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
  };
}

export async function countCompletedSessions(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM sessions WHERE status = 'completed'"
  );
  return row ? Number(row.c) : 0;
}

export async function listCompletedSessions(
  db: SQLiteDatabase,
  limit = 50
): Promise<SessionRow[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    "SELECT * FROM sessions WHERE status = 'completed' ORDER BY completed_at DESC LIMIT ?",
    limit
  );
  return rows.map((row) => ({
    id: Number(row.id),
    templateId: row.template_id == null ? null : Number(row.template_id),
    title: row.title == null ? null : String(row.title),
    status: row.status as SessionRow['status'],
    startedAt: String(row.started_at),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
  }));
}

/**
 * Fügt eine bereits abgeschlossene Einheit mit explizitem Datum ein
 * (für Demo-Daten / Backups). Schreibt Übungen und Sätze direkt mit.
 */
export async function insertCompletedSession(
  db: SQLiteDatabase,
  opts: {
    title: string;
    templateId: number | null;
    startedAt: string;
    completedAt: string;
    exercises: { name: string; sets: { reps: number | null; weightKg: number | null }[] }[];
  }
): Promise<number> {
  const res = await db.runAsync(
    "INSERT INTO sessions (template_id, title, status, started_at, completed_at) VALUES (?, ?, 'completed', ?, ?)",
    opts.templateId,
    opts.title,
    opts.startedAt,
    opts.completedAt
  );
  const sessionId = Number(res.lastInsertRowId);
  for (let i = 0; i < opts.exercises.length; i++) {
    const ex = opts.exercises[i];
    const exRes = await db.runAsync(
      'INSERT INTO session_exercises (session_id, name, sort_order) VALUES (?, ?, ?)',
      sessionId,
      ex.name,
      i
    );
    const exId = Number(exRes.lastInsertRowId);
    for (let s = 0; s < ex.sets.length; s++) {
      await db.runAsync(
        'INSERT INTO sets (exercise_id, set_index, reps, weight_kg) VALUES (?, ?, ?, ?)',
        exId,
        s,
        ex.sets[s].reps,
        ex.sets[s].weightKg
      );
    }
  }
  return sessionId;
}

/** Löscht alle Nutzerdaten (Pläne, Einheiten, Chat, Einstellungen) und setzt das Profil zurück. */
export async function resetAllData(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM sessions;
    DELETE FROM workout_templates;
    DELETE FROM chat_messages;
    DELETE FROM body_weights;
    DELETE FROM app_settings;
    UPDATE profile SET display_name = 'Athlet', height_cm = NULL, weight_kg = NULL,
      notes = NULL, goal_title = NULL, goal_target_weight = NULL, goal_note = NULL,
      updated_at = datetime('now') WHERE id = 1;
  `);
}

/** Exportiert alle Trainingsdaten als JSON-String (lokales Backup). */
export async function exportAllData(db: SQLiteDatabase): Promise<string> {
  const profile = await getProfile(db);
  const templates = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM workout_templates');
  const templateExercises = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM template_exercises');
  const sessions = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM sessions');
  const sessionExercises = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM session_exercises');
  const sets = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM sets');
  const bodyWeights = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM body_weights');
  return JSON.stringify(
    {
      app: 'gAIn',
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      templates,
      templateExercises,
      sessions,
      sessionExercises,
      sets,
      bodyWeights,
    },
    null,
    2
  );
}

/** Summe (Gewicht × Wiederholungen) pro abgeschlossener Session */
export async function sessionVolumeKg(
  db: SQLiteDatabase,
  sessionId: number
): Promise<number> {
  const rows = await db.getAllAsync<{ w: number | null; r: number | null }>(
    `SELECT s.weight_kg as w, s.reps as r FROM sets s
     JOIN session_exercises e ON e.id = s.exercise_id
     WHERE e.session_id = ?`,
    sessionId
  );
  let vol = 0;
  for (const row of rows) {
    const w = row.w ?? 0;
    const r = row.r ?? 0;
    vol += w * r;
  }
  return vol;
}

export async function progressByWeek(db: SQLiteDatabase, weeks = 8): Promise<ProgressWeek[]> {
  const rows = await db.getAllAsync<{ week_key: string; sessions: number; volume: number }>(
    `
    WITH completed AS (
      SELECT id, completed_at FROM sessions
      WHERE status = 'completed' AND completed_at IS NOT NULL
    ),
    vol AS (
      SELECT e.session_id as sid,
             COALESCE(s.weight_kg, 0) * COALESCE(s.reps, 0) as v
      FROM sets s
      JOIN session_exercises e ON e.id = s.exercise_id
    )
    SELECT strftime('%Y', c.completed_at) || '-W' || strftime('%W', c.completed_at) as week_key,
           COUNT(DISTINCT c.id) as sessions,
           COALESCE(SUM(v.v), 0) as volume
    FROM completed c
    LEFT JOIN vol v ON v.sid = c.id
    GROUP BY week_key
    ORDER BY week_key DESC
    LIMIT ?
    `,
    weeks
  );
  return rows.map((r) => ({
    weekStart: r.week_key,
    sessionCount: Number(r.sessions),
    volumeKg: Number(r.volume),
  }));
}

// ── App Settings ─────────────────────────────────────────────────────────────

export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM app_settings WHERE key = ?',
    key
  );
  return row ? row.value : null;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
}

// ── Chat Messages ─────────────────────────────────────────────────────────────

export async function listChatMessages(db: SQLiteDatabase): Promise<ChatMessage[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM chat_messages ORDER BY created_at ASC'
  );
  return rows.map((r) => ({
    id: Number(r.id),
    role: String(r.role) as ChatMessage['role'],
    content: String(r.content),
    createdAt: String(r.created_at),
  }));
}

export async function insertChatMessage(
  db: SQLiteDatabase,
  role: ChatMessage['role'],
  content: string
): Promise<number> {
  const res = await db.runAsync(
    'INSERT INTO chat_messages (role, content) VALUES (?, ?)',
    role,
    content
  );
  return Number(res.lastInsertRowId);
}

export async function clearChatMessages(db: SQLiteDatabase) {
  await db.runAsync('DELETE FROM chat_messages');
}

// ── Analytics / Reporting (Datenschicht) ───────────────────────────────────────

export type TrainingSummary = {
  totalSessions: number;
  totalVolumeKg: number;
  totalSets: number;
  firstDate: string | null;
  lastDate: string | null;
};

/** Gesamtkennzahlen über alle abgeschlossenen Einheiten. */
export async function trainingSummary(db: SQLiteDatabase): Promise<TrainingSummary> {
  const row = await db.getFirstAsync<{
    total: number;
    volume: number | null;
    sets: number;
    first_date: string | null;
    last_date: string | null;
  }>(
    `SELECT
       COUNT(DISTINCT s.id) as total,
       COALESCE(SUM(COALESCE(st.weight_kg, 0) * COALESCE(st.reps, 0)), 0) as volume,
       COUNT(st.id) as sets,
       MIN(s.completed_at) as first_date,
       MAX(s.completed_at) as last_date
     FROM sessions s
     LEFT JOIN session_exercises e ON e.session_id = s.id
     LEFT JOIN sets st ON st.exercise_id = e.id
     WHERE s.status = 'completed' AND s.completed_at IS NOT NULL`
  );
  return {
    totalSessions: row ? Number(row.total) : 0,
    totalVolumeKg: row && row.volume != null ? Number(row.volume) : 0,
    totalSets: row ? Number(row.sets) : 0,
    firstDate: row?.first_date ?? null,
    lastDate: row?.last_date ?? null,
  };
}

export type WeekdayCount = { weekday: number; count: number };

/** Verteilung der Trainings über die Wochentage (0 = Sonntag … 6 = Samstag). */
export async function weekdayDistribution(db: SQLiteDatabase): Promise<WeekdayCount[]> {
  const rows = await db.getAllAsync<{ wd: string; c: number }>(
    `SELECT strftime('%w', completed_at) as wd, COUNT(*) as c
     FROM sessions
     WHERE status = 'completed' AND completed_at IS NOT NULL
     GROUP BY wd`
  );
  return rows.map((r) => ({ weekday: Number(r.wd), count: Number(r.c) }));
}

export type ExerciseVolume = {
  name: string;
  volumeKg: number;
  sets: number;
  sessions: number;
};

/** Volumen / Satzanzahl je Übung (für Top-Übungen und Muskelgruppen-Verteilung). */
export async function exerciseVolumeTotals(db: SQLiteDatabase): Promise<ExerciseVolume[]> {
  const rows = await db.getAllAsync<{
    name: string;
    volume: number | null;
    sets: number;
    sessions: number;
  }>(
    `SELECT e.name as name,
            COALESCE(SUM(COALESCE(st.weight_kg, 0) * COALESCE(st.reps, 0)), 0) as volume,
            COUNT(st.id) as sets,
            COUNT(DISTINCT e.session_id) as sessions
     FROM session_exercises e
     JOIN sessions s ON s.id = e.session_id AND s.status = 'completed'
     LEFT JOIN sets st ON st.exercise_id = e.id
     GROUP BY e.name COLLATE NOCASE
     ORDER BY volume DESC`
  );
  return rows.map((r) => ({
    name: r.name,
    volumeKg: r.volume != null ? Number(r.volume) : 0,
    sets: Number(r.sets),
    sessions: Number(r.sessions),
  }));
}

export type LastPerformance = { date: string; weightKg: number; reps: number };

/** Bester Satz der zuletzt abgeschlossenen Einheit mit dieser Übung (für „Letztes Mal"). */
export async function lastExercisePerformance(
  db: SQLiteDatabase,
  exerciseName: string
): Promise<LastPerformance | null> {
  const row = await db.getFirstAsync<{ date: string; w: number; r: number | null }>(
    `SELECT s.completed_at as date, st.weight_kg as w, st.reps as r
     FROM sessions s
     JOIN session_exercises e ON e.session_id = s.id
     JOIN sets st ON st.exercise_id = e.id
     WHERE s.status = 'completed' AND e.name = ? AND st.weight_kg IS NOT NULL
     ORDER BY s.completed_at DESC, st.weight_kg DESC
     LIMIT 1`,
    exerciseName
  );
  if (!row) return null;
  return { date: row.date, weightKg: Number(row.w), reps: row.r == null ? 0 : Number(row.r) };
}

/** Höchstes je in einer abgeschlossenen Einheit bewegtes Gewicht (für PR-Erkennung). */
export async function exerciseMaxWeight(
  db: SQLiteDatabase,
  exerciseName: string
): Promise<number | null> {
  const row = await db.getFirstAsync<{ m: number | null }>(
    `SELECT MAX(st.weight_kg) as m
     FROM sessions s
     JOIN session_exercises e ON e.session_id = s.id
     JOIN sets st ON st.exercise_id = e.id
     WHERE s.status = 'completed' AND e.name = ?`,
    exerciseName
  );
  return row && row.m != null ? Number(row.m) : null;
}

export type ExerciseProgressPoint = {
  sessionId: number;
  date: string;
  maxWeight: number;
  reps: number;
  estOneRm: number;
};

/**
 * Fortschritt einer einzelnen Übung über die Zeit: pro Einheit der schwerste Satz
 * (inkl. geschätztem 1RM nach Epley). Zeigt z. B. „Bank Woche 1 vs. Woche 6".
 */
export async function exerciseProgress(
  db: SQLiteDatabase,
  exerciseName: string
): Promise<ExerciseProgressPoint[]> {
  const rows = await db.getAllAsync<{
    sid: number;
    date: string;
    w: number | null;
    r: number | null;
  }>(
    `SELECT s.id as sid, s.completed_at as date, st.weight_kg as w, st.reps as r
     FROM sessions s
     JOIN session_exercises e ON e.session_id = s.id
     JOIN sets st ON st.exercise_id = e.id
     WHERE s.status = 'completed' AND s.completed_at IS NOT NULL
       AND e.name = ? AND st.weight_kg IS NOT NULL
     ORDER BY s.completed_at ASC`,
    exerciseName
  );
  const bySession = new Map<number, ExerciseProgressPoint>();
  for (const row of rows) {
    const w = row.w ?? 0;
    const r = row.r ?? 0;
    const existing = bySession.get(row.sid);
    if (!existing || w > existing.maxWeight) {
      bySession.set(row.sid, {
        sessionId: row.sid,
        date: row.date,
        maxWeight: w,
        reps: r,
        estOneRm: Math.round(w * (1 + r / 30)), // Epley-Formel
      });
    }
  }
  return Array.from(bySession.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// ── Körpergewicht ───────────────────────────────────────────────────────────────

export async function addBodyWeight(db: SQLiteDatabase, weightKg: number): Promise<number> {
  const res = await db.runAsync('INSERT INTO body_weights (weight_kg) VALUES (?)', weightKg);
  return Number(res.lastInsertRowId);
}

export async function listBodyWeights(db: SQLiteDatabase, limit = 60): Promise<BodyWeight[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM body_weights ORDER BY recorded_at DESC LIMIT ?',
    limit
  );
  return rows.map((r) => ({
    id: Number(r.id),
    weightKg: Number(r.weight_kg),
    recordedAt: String(r.recorded_at),
  }));
}

export async function deleteBodyWeight(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM body_weights WHERE id = ?', id);
}
