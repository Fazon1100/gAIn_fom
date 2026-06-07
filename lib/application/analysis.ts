import type { SQLiteDatabase } from 'expo-sqlite';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  getExerciseByName,
  type MuscleCategory,
} from './exercises';
import * as repo from '../data/repository';
import type { ExerciseProgressPoint } from '../data/repository';
import type { Profile } from '../data/types';

// ── Aufbereitete Analyse-Daten (Anwendungsschicht) ──────────────────────────────

export type WeekPoint = { key: string; label: string; sessions: number; volumeKg: number };
export type WeekdayPoint = { label: string; count: number };
export type MuscleSlice = {
  category: MuscleCategory;
  label: string;
  color: string;
  volumeKg: number;
  pct: number;
};
export type TopExercise = { name: string; volumeKg: number; sets: number; sessions: number };
export type ExerciseTrend = { name: string; points: ExerciseProgressPoint[] };

export type AnalyticsData = {
  totalSessions: number;
  totalVolumeKg: number;
  totalSets: number;
  firstDate: string | null;
  lastDate: string | null;
  weeks: WeekPoint[];
  thisWeekSessions: number;
  lastWeekSessions: number;
  thisWeekVolume: number;
  lastWeekVolume: number;
  streakWeeks: number;
  avgSessionsPerWeek: number;
  weekdays: WeekdayPoint[];
  muscleGroups: MuscleSlice[];
  topExercises: TopExercise[];
  trainedExerciseNames: string[];
  exerciseTrends: ExerciseTrend[];
  /** ändert sich, sobald neue Daten vorliegen – für Caching der KI-Analyse */
  signature: string;
};

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** Wandelt "YYYY-Www" in einen vergleichbaren Index (Jahr*53 + KW). */
function weekIndex(key: string): number {
  const m = key.match(/^(\d{4})-W(\d{1,2})$/);
  if (!m) return 0;
  return Number(m[1]) * 53 + Number(m[2]);
}

function weekLabel(key: string): string {
  const m = key.match(/^(\d{4})-W(\d{1,2})$/);
  return m ? `KW${m[2]}` : key;
}

/** Sammelt alle Reporting-Daten aus der Datenschicht und leitet Kennzahlen ab. */
export async function collectAnalytics(db: SQLiteDatabase): Promise<AnalyticsData> {
  const [summary, weeksDesc, weekdayDist, exVolumes] = await Promise.all([
    repo.trainingSummary(db),
    repo.progressByWeek(db, 8),
    repo.weekdayDistribution(db),
    repo.exerciseVolumeTotals(db),
  ]);

  // Wochen chronologisch (älteste zuerst)
  const weeks: WeekPoint[] = [...weeksDesc]
    .sort((a, b) => weekIndex(a.weekStart) - weekIndex(b.weekStart))
    .map((w) => ({
      key: w.weekStart,
      label: weekLabel(w.weekStart),
      sessions: w.sessionCount,
      volumeKg: Math.round(w.volumeKg),
    }));

  const lastIdx = weeks.length - 1;
  const thisWeek = lastIdx >= 0 ? weeks[lastIdx] : null;
  const prevWeek = lastIdx >= 1 ? weeks[lastIdx - 1] : null;

  // Aktuelle Serie: zusammenhängende Wochen am Ende der Liste
  let streakWeeks = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].sessions <= 0) break;
    if (i === weeks.length - 1) {
      streakWeeks = 1;
    } else if (weekIndex(weeks[i + 1].key) - weekIndex(weeks[i].key) === 1) {
      streakWeeks++;
    } else {
      break;
    }
  }

  // Schnitt pro Woche über den aktiven Zeitraum
  let avgSessionsPerWeek = 0;
  if (summary.firstDate && summary.lastDate && summary.totalSessions > 0) {
    const first = new Date(summary.firstDate.replace(' ', 'T')).getTime();
    const last = new Date(summary.lastDate.replace(' ', 'T')).getTime();
    const spanWeeks = Math.max(1, Math.ceil((last - first) / (7 * 24 * 3600 * 1000)));
    avgSessionsPerWeek = Math.round((summary.totalSessions / spanWeeks) * 10) / 10;
  }

  // Wochentage in Mo..So-Reihenfolge (SQLite: 0=So..6=Sa)
  const wdMap = new Map<number, number>();
  for (const w of weekdayDist) wdMap.set(w.weekday, w.count);
  const weekdays: WeekdayPoint[] = WEEKDAY_LABELS.map((label, i) => {
    const sqliteDow = (i + 1) % 7; // Mo(0)->1, ... So(6)->0
    return { label, count: wdMap.get(sqliteDow) ?? 0 };
  });

  // Muskelgruppen-Verteilung nach Volumen (über Übungskatalog gemappt)
  const muscleVol = new Map<MuscleCategory, number>();
  for (const ex of exVolumes) {
    const cat = getExerciseByName(ex.name)?.category;
    if (!cat) continue;
    muscleVol.set(cat, (muscleVol.get(cat) ?? 0) + ex.volumeKg);
  }
  const muscleTotal = Array.from(muscleVol.values()).reduce((a, b) => a + b, 0);
  const muscleGroups: MuscleSlice[] = Array.from(muscleVol.entries())
    .map(([category, volumeKg]) => ({
      category,
      label: CATEGORY_LABELS[category],
      color: CATEGORY_COLORS[category],
      volumeKg: Math.round(volumeKg),
      pct: muscleTotal > 0 ? Math.round((volumeKg / muscleTotal) * 100) : 0,
    }))
    .sort((a, b) => b.volumeKg - a.volumeKg);

  const topExercises: TopExercise[] = exVolumes.slice(0, 5).map((e) => ({
    name: e.name,
    volumeKg: Math.round(e.volumeKg),
    sets: e.sets,
    sessions: e.sessions,
  }));

  // Übungen mit Gewichtsdaten für die Auswahl im Verlaufs-Chart
  const trainedExerciseNames = exVolumes.filter((e) => e.volumeKg > 0).map((e) => e.name);

  // Verlaufsdaten für die Top-3-Übungen vorab laden (für KI + Default-Chart)
  const trendTargets = trainedExerciseNames.slice(0, 3);
  const exerciseTrends: ExerciseTrend[] = await Promise.all(
    trendTargets.map(async (name) => ({
      name,
      points: await repo.exerciseProgress(db, name),
    }))
  );

  const signature = `${summary.totalSessions}:${summary.totalSets}:${summary.lastDate ?? ''}`;

  return {
    totalSessions: summary.totalSessions,
    totalVolumeKg: Math.round(summary.totalVolumeKg),
    totalSets: summary.totalSets,
    firstDate: summary.firstDate,
    lastDate: summary.lastDate,
    weeks,
    thisWeekSessions: thisWeek?.sessions ?? 0,
    lastWeekSessions: prevWeek?.sessions ?? 0,
    thisWeekVolume: thisWeek?.volumeKg ?? 0,
    lastWeekVolume: prevWeek?.volumeKg ?? 0,
    streakWeeks,
    avgSessionsPerWeek,
    weekdays,
    muscleGroups,
    topExercises,
    trainedExerciseNames,
    exerciseTrends,
    signature,
  };
}

function fmtDate(iso: string | null): string {
  if (!iso) return '–';
  try {
    return new Date(iso.replace(' ', 'T')).toLocaleDateString('de-DE');
  } catch {
    return iso;
  }
}

/** Kompakter Text der Trainingsdaten als Eingabe für die KI. */
export function formatAnalyticsForAi(data: AnalyticsData, profile: Profile | null): string {
  const lines: string[] = [];

  lines.push(`Zeitraum: ${fmtDate(data.firstDate)} bis ${fmtDate(data.lastDate)}`);
  lines.push(`Einheiten gesamt: ${data.totalSessions}`);
  lines.push(
    `Gesamtvolumen: ${data.totalVolumeKg.toLocaleString('de-DE')} kg·Wdh über ${data.totalSets} Sätze`
  );
  lines.push(
    `Schnitt: ${data.avgSessionsPerWeek} Einheiten/Woche · aktuelle Serie: ${data.streakWeeks} Woche(n) in Folge`
  );
  lines.push(
    `Aktuelle Woche vs. Vorwoche: ${data.thisWeekSessions} vs. ${data.lastWeekSessions} Einheiten, ` +
      `${data.thisWeekVolume.toLocaleString('de-DE')} vs. ${data.lastWeekVolume.toLocaleString('de-DE')} kg·Wdh`
  );

  if (data.weeks.length > 0) {
    lines.push('\nLetzte Wochen (Einheiten | Volumen kg·Wdh):');
    for (const w of data.weeks) {
      lines.push(`- ${w.label}: ${w.sessions} | ${w.volumeKg.toLocaleString('de-DE')}`);
    }
  }

  const activeDays = data.weekdays.filter((d) => d.count > 0);
  if (activeDays.length > 0) {
    lines.push('\nTrainings nach Wochentag: ' + activeDays.map((d) => `${d.label} ${d.count}`).join(', '));
  }

  if (data.muscleGroups.length > 0) {
    lines.push('\nMuskelgruppen-Verteilung (Volumenanteil):');
    for (const m of data.muscleGroups) {
      lines.push(`- ${m.label}: ${m.pct}%`);
    }
  }

  if (data.topExercises.length > 0) {
    lines.push('\nTop-Übungen (Volumen):');
    for (const e of data.topExercises) {
      lines.push(
        `- ${e.name}: ${e.volumeKg.toLocaleString('de-DE')} kg·Wdh, ${e.sets} Sätze, ${e.sessions} Einheiten`
      );
    }
  }

  const trendsWithData = data.exerciseTrends.filter((t) => t.points.length > 0);
  if (trendsWithData.length > 0) {
    lines.push('\nKraftverlauf (schwerster Satz je Einheit, chronologisch):');
    for (const t of trendsWithData) {
      const traj = t.points
        .map((p) => `${fmtDate(p.date)}: ${p.maxWeight}kg×${p.reps} (≈1RM ${p.estOneRm})`)
        .join('  →  ');
      lines.push(`- ${t.name}: ${traj}`);
    }
  }

  if (profile?.goalTitle || profile?.goalTargetWeight != null || profile?.goalNote) {
    const g: string[] = [];
    if (profile.goalTitle) g.push(profile.goalTitle);
    if (profile.goalTargetWeight != null) g.push(`Zielgewicht ${profile.goalTargetWeight} kg`);
    if (profile.goalNote) g.push(profile.goalNote);
    lines.push(`\nZiel des Nutzers: ${g.join(' · ')}`);
  }

  return lines.join('\n');
}

/** Regelbasierte Kurzanalyse als Fallback, wenn (noch) keine KI verfügbar ist. */
export function buildQuickSummary(data: AnalyticsData): string {
  if (data.totalSessions === 0) {
    return 'Noch keine abgeschlossenen Trainings. Sobald du eine Einheit speicherst, erscheint hier deine Auswertung.';
  }
  const parts: string[] = [];
  parts.push(`${data.totalSessions} Einheiten · ⌀ ${data.avgSessionsPerWeek}/Woche.`);
  if (data.streakWeeks >= 2) parts.push(`Aktuelle Serie: ${data.streakWeeks} Wochen in Folge. 🔥`);
  if (data.thisWeekVolume > data.lastWeekVolume && data.lastWeekVolume > 0) {
    parts.push('Volumen gegenüber der Vorwoche gestiegen – saubere Progression.');
  } else if (data.thisWeekVolume < data.lastWeekVolume * 0.85 && data.lastWeekVolume > 0) {
    parts.push('Volumen unter der Vorwoche – achte auf Erholung & Intensität.');
  }
  if (data.muscleGroups.length > 0) {
    const top = data.muscleGroups[0];
    parts.push(`Fokus liegt aktuell auf ${top.label} (${top.pct}% des Volumens).`);
  }
  parts.push('Für eine ausführliche Analyse hinterlege einen KI-Schlüssel im Profil.');
  return parts.join(' ');
}
