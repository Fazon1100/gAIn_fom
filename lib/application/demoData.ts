import type { SQLiteDatabase } from 'expo-sqlite';
import { getExercisesByCategory, type Exercise, type MuscleCategory } from './exercises';
import * as repo from '../data/repository';

/**
 * Befüllt die App mit realistischen Demo-Daten für eine überzeugende Live-Demo:
 * Profil + Ziel, drei Trainingspläne (Push/Pull/Legs) und ~8 Wochen Trainings-
 * historie mit sichtbarer Progression (inkl. einer schwächeren Woche).
 */

type ExConfig = {
  name: string;
  base: number;
  step: number;
  reps: number;
  bodyweight?: boolean;
  dip?: boolean;
};

function pick(category: MuscleCategory, idx: number): Exercise {
  const list = getExercisesByCategory(category);
  return list[idx] ?? list[0];
}

function toSql(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
}

function round05(n: number): number {
  return Math.round(n * 2) / 2;
}

const DAY = 24 * 3600 * 1000;
const WEEK = 7 * DAY;
const WEEKS = 8;

export async function loadDemoData(db: SQLiteDatabase): Promise<void> {
  await repo.resetAllData(db);

  // Profil + Ziel
  await repo.saveProfile(db, {
    displayName: 'Max Mustermann',
    heightCm: 180,
    weightKg: 80,
    notes: 'Trainiert 3–4× pro Woche, keine Verletzungen.',
  });
  await repo.saveGoal(db, {
    title: '85 kg & sichtbar stärker werden',
    targetWeight: 85,
    note: 'Fokus auf Muskelaufbau im Oberkörper, mittelfristig stärkere Grundübungen. 4 Einheiten/Woche.',
  });

  // KI im Offline-Modus + Onboarding als erledigt markieren
  await repo.setSetting(db, 'ai_provider', 'offline');
  await repo.setSetting(db, 'ai_model', 'offline-coach');
  await repo.setSetting(db, 'onboarding_done', '1');

  // Tages-Konfigurationen (Übungen kommen aus dem Katalog → immer gültige Namen)
  const push: ExConfig[] = [
    { name: pick('brust', 0).name, base: 50, step: 2.5, reps: 8, dip: true },
    { name: pick('schultern', 0).name, base: 30, step: 1.5, reps: 10 },
    { name: pick('trizeps', 0).name, base: 25, step: 1, reps: 12 },
  ];
  const pull: ExConfig[] = [
    { name: pick('ruecken', 0).name, base: 45, step: 2.5, reps: 8 },
    { name: pick('ruecken', 1).name, base: 40, step: 2, reps: 10 },
    { name: pick('bizeps', 0).name, base: 14, step: 0.5, reps: 12 },
  ];
  const legs: ExConfig[] = [
    { name: pick('beine', 0).name, base: 60, step: 5, reps: 8 },
    { name: pick('beine', 2).name, base: 50, step: 2.5, reps: 10 },
    { name: pick('core', 0).name, base: 0, step: 0, reps: 45, bodyweight: true },
  ];

  // Trainingspläne anlegen (damit man sie in der Demo auch starten kann)
  const days: { title: string; cfg: ExConfig[] }[] = [
    { title: 'Push Day', cfg: push },
    { title: 'Pull Day', cfg: pull },
    { title: 'Leg Day', cfg: legs },
  ];
  const templateIds: Record<string, number> = {};
  for (const day of days) {
    const tId = await repo.createTemplate(db, day.title);
    templateIds[day.title] = tId;
    for (const ex of day.cfg) {
      await repo.addTemplateExercise(db, tId, ex.name, null, 3, ex.bodyweight ? `${ex.reps}s` : `${ex.reps}`);
    }
  }

  const now = Date.now();

  // 8 Wochen × 3 Einheiten mit Progression
  for (let w = 0; w < WEEKS; w++) {
    const weekBase = now - (WEEKS - w) * WEEK;
    const dayOffsets = [0, 2 * DAY, 4 * DAY]; // Mo / Mi / Fr

    // Push / Pull / Legs der Woche
    for (let di = 0; di < days.length; di++) {
      const day = days[di];
      const completedMs = weekBase + dayOffsets[di] + 18 * 3600 * 1000; // 18 Uhr
      const startedMs = completedMs - 70 * 60 * 1000; // ~70 min Dauer
      const exercises = day.cfg.map((ex) => {
        let weight: number | null;
        if (ex.bodyweight) {
          weight = null;
        } else {
          let raw = ex.base + w * ex.step;
          if (ex.dip && w === 5) raw -= 5; // bewusste „schwächere Woche"
          weight = round05(raw);
        }
        const sets = Array.from({ length: 3 }, (_, s) => ({
          reps: ex.bodyweight ? ex.reps : Math.max(5, ex.reps - s),
          weightKg: weight,
        }));
        return { name: ex.name, sets };
      });

      await repo.insertCompletedSession(db, {
        title: day.title,
        templateId: templateIds[day.title] ?? null,
        startedAt: toSql(startedMs),
        completedAt: toSql(completedMs),
        exercises,
      });
    }
  }
}
