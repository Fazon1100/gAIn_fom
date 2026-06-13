import { offlineAnalysis, offlineChat, offlinePlan } from '../lib/application/offlineAi';
import { getExerciseByName } from '../lib/application/exercises';
import type { AnalyticsData } from '../lib/application/analysis';

function makeData(overrides: Partial<AnalyticsData> = {}): AnalyticsData {
  return {
    totalSessions: 12,
    totalVolumeKg: 50000,
    totalSets: 144,
    firstDate: '2026-03-01 18:00:00',
    lastDate: '2026-04-26 18:00:00',
    weeks: [
      { key: '2026-W12', label: 'KW12', sessions: 3, volumeKg: 5000 },
      { key: '2026-W13', label: 'KW13', sessions: 3, volumeKg: 5500 },
      { key: '2026-W14', label: 'KW14', sessions: 3, volumeKg: 6000 },
    ],
    thisWeekSessions: 3,
    lastWeekSessions: 3,
    thisWeekVolume: 6000,
    lastWeekVolume: 5500,
    streakWeeks: 3,
    avgSessionsPerWeek: 3,
    weekdays: [
      { label: 'Mo', count: 4 },
      { label: 'Mi', count: 4 },
      { label: 'Fr', count: 4 },
    ],
    muscleGroups: [
      { category: 'brust', label: 'Brust', color: '#FF6B6B', volumeKg: 20000, pct: 40 },
      { category: 'beine', label: 'Beine', color: '#A78BFA', volumeKg: 30000, pct: 60 },
    ],
    topExercises: [{ name: 'Bankdrücken', volumeKg: 20000, sets: 40, sessions: 10 }],
    trainedExerciseNames: ['Bankdrücken'],
    exerciseTrends: [
      {
        name: 'Bankdrücken',
        points: [
          { sessionId: 1, date: '2026-03-01 18:00:00', maxWeight: 50, reps: 8, estOneRm: 63 },
          { sessionId: 2, date: '2026-04-26 18:00:00', maxWeight: 60, reps: 8, estOneRm: 76 },
        ],
      },
    ],
    signature: 'sig',
    ...overrides,
  };
}

describe('offlinePlan', () => {
  it('erstellt drei Tage für Push/Pull/Legs', () => {
    const plans = offlinePlan('Erstell mir einen Push Pull Legs Plan', null);
    expect(plans).toHaveLength(3);
    expect(plans.map((p) => p.name)).toEqual(
      expect.arrayContaining([expect.stringContaining('Push'), expect.stringContaining('Pull')])
    );
  });

  it('erstellt einen Tag für Ganzkörper', () => {
    const plans = offlinePlan('Ganzkörper Training für Anfänger', null);
    expect(plans).toHaveLength(1);
  });

  it('verwendet ausschließlich gültige Übungsnamen aus dem Katalog', () => {
    const plans = offlinePlan('Push Pull Legs', null);
    for (const plan of plans) {
      expect(plan.exercises.length).toBeGreaterThan(0);
      for (const ex of plan.exercises) {
        expect(getExerciseByName(ex.name)).toBeDefined();
        expect(ex.sets).toBeGreaterThan(0);
        expect(typeof ex.reps).toBe('string');
      }
    }
  });

  it('berücksichtigt das Niveau (Anfänger = weniger Sätze)', () => {
    const beginner = offlinePlan('Ganzkörper Anfänger', null)[0];
    const pro = offlinePlan('Ganzkörper Profi', null)[0];
    expect(beginner.exercises[0].sets).toBeLessThanOrEqual(pro.exercises[0].sets);
  });
});

describe('offlineChat', () => {
  it('antwortet zum Thema Protein', () => {
    const reply = offlineChat([{ role: 'user', content: 'Wie viel Protein brauche ich?' }], null);
    expect(reply.toLowerCase()).toContain('protein');
  });

  it('gibt eine sinnvolle Standardantwort bei unbekannter Frage', () => {
    const reply = offlineChat([{ role: 'user', content: 'asdf qwerty' }], null);
    expect(reply).toContain('Offline-Coach');
  });
});

describe('offlineAnalysis', () => {
  it('liefert alle vier Abschnitte', () => {
    const text = offlineAnalysis(makeData(), null);
    expect(text).toContain('📊');
    expect(text).toContain('✅');
    expect(text).toContain('⚠️');
    expect(text).toContain('🎯');
  });

  it('erkennt steigenden Kraftverlauf', () => {
    const text = offlineAnalysis(makeData(), null);
    expect(text).toContain('Bankdrücken');
  });

  it('behandelt den Fall ohne Trainings', () => {
    const text = offlineAnalysis(makeData({ totalSessions: 0 }), null);
    expect(text.toLowerCase()).toContain('noch keine');
  });
});
