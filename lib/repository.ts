import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  ChatMessage,
  Goal,
  GoalKind,
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
    updatedAt: String(r.updated_at),
  };
}

function mapGoal(r: Record<string, unknown>): Goal {
  return {
    id: Number(r.id),
    kind: r.kind as GoalKind,
    title: String(r.title),
    targetValue: r.target_value == null ? null : Number(r.target_value),
    unit: r.unit == null ? null : String(r.unit),
    deadline: r.deadline == null ? null : String(r.deadline),
    createdAt: String(r.created_at),
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

export async function listGoals(db: SQLiteDatabase): Promise<Goal[]> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM goals ORDER BY created_at DESC'
  );
  return rows.map(mapGoal);
}

export async function insertGoal(
  db: SQLiteDatabase,
  g: {
    kind: GoalKind;
    title: string;
    targetValue: number | null;
    unit: string | null;
    deadline: string | null;
  }
) {
  await db.runAsync(
    `INSERT INTO goals (kind, title, target_value, unit, deadline) VALUES (?, ?, ?, ?, ?)`,
    g.kind,
    g.title,
    g.targetValue,
    g.unit,
    g.deadline
  );
}

export async function deleteGoal(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM goals WHERE id = ?', id);
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

export async function createEmptySession(db: SQLiteDatabase, title: string | null): Promise<number> {
  const res = await db.runAsync(
    "INSERT INTO sessions (template_id, title, status) VALUES (NULL, ?, 'in_progress')",
    title
  );
  return Number(res.lastInsertRowId);
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

export function buildAnalysisText(input: {
  totalSessions: number;
  lastWeekSessions: number;
  prevWeekSessions: number;
  lastWeekVolume: number;
  prevWeekVolume: number;
}): string {
  const parts: string[] = [];
  if (input.totalSessions === 0) {
    return 'Noch keine abgeschlossenen Trainings. Leg los – die ersten Einträge erscheinen hier nach dem Speichern einer Einheit.';
  }
  parts.push(`Insgesamt ${input.totalSessions} abgeschlossene Trainingseinheiten.`);

  if (input.lastWeekSessions > input.prevWeekSessions) {
    parts.push(
      `Diese Woche häufiger trainiert als die Vorwoche (${input.lastWeekSessions} vs. ${input.prevWeekSessions}).`
    );
  } else if (input.lastWeekSessions < input.prevWeekSessions && input.prevWeekSessions > 0) {
    parts.push(
      `Letzte Woche warst du seltener im Gym als in der Woche davor (${input.lastWeekSessions} vs. ${input.prevWeekSessions}).`
    );
  }

  if (input.lastWeekVolume > input.prevWeekVolume * 1.05 && input.prevWeekVolume > 0) {
    parts.push('Das Trainingsvolumen (kg × Wdh.) ist gegenüber der Vorwoche gestiegen – solide Progression.');
  } else if (input.lastWeekVolume < input.prevWeekVolume * 0.85 && input.prevWeekVolume > 0) {
    parts.push('Das Volumen liegt unter dem der Vorwoche – prüfe Erholung, Intensität oder Zeit im Gym.');
  }

  if (parts.length === 1) {
    parts.push('Weiter so – mit mehr Daten werden die Trends klarer.');
  }
  return parts.join(' ');
}
