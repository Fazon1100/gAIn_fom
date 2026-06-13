import { buildQuickSummary, formatAnalyticsForAi, type AnalyticsData } from '../lib/application/analysis';

function makeData(overrides: Partial<AnalyticsData> = {}): AnalyticsData {
  return {
    totalSessions: 8,
    totalVolumeKg: 32000,
    totalSets: 96,
    firstDate: '2026-03-01 18:00:00',
    lastDate: '2026-04-19 18:00:00',
    weeks: [
      { key: '2026-W12', label: 'KW12', sessions: 2, volumeKg: 4000 },
      { key: '2026-W13', label: 'KW13', sessions: 3, volumeKg: 5000 },
    ],
    thisWeekSessions: 3,
    lastWeekSessions: 2,
    thisWeekVolume: 5000,
    lastWeekVolume: 4000,
    streakWeeks: 2,
    avgSessionsPerWeek: 2.5,
    weekdays: [{ label: 'Mo', count: 4 }],
    muscleGroups: [{ category: 'brust', label: 'Brust', color: '#FF6B6B', volumeKg: 32000, pct: 100 }],
    topExercises: [{ name: 'Bankdrücken', volumeKg: 32000, sets: 96, sessions: 8 }],
    trainedExerciseNames: ['Bankdrücken'],
    exerciseTrends: [],
    signature: 'sig',
    ...overrides,
  };
}

describe('formatAnalyticsForAi', () => {
  it('enthält zentrale Kennzahlen und Übungen', () => {
    const text = formatAnalyticsForAi(makeData(), null);
    expect(text).toContain('Einheiten gesamt: 8');
    expect(text).toContain('Bankdrücken');
    expect(text).toContain('Brust');
  });

  it('berücksichtigt das Ziel aus dem Profil', () => {
    const text = formatAnalyticsForAi(makeData(), {
      id: 1,
      displayName: 'Max',
      heightCm: 180,
      weightKg: 80,
      notes: null,
      goalTitle: '85 kg erreichen',
      goalTargetWeight: 85,
      goalNote: null,
      updatedAt: '',
    });
    expect(text).toContain('85 kg erreichen');
  });
});

describe('buildQuickSummary', () => {
  it('meldet, wenn noch keine Trainings vorliegen', () => {
    const text = buildQuickSummary(makeData({ totalSessions: 0 }));
    expect(text.toLowerCase()).toContain('noch keine');
  });

  it('fasst vorhandene Trainings zusammen', () => {
    const text = buildQuickSummary(makeData());
    expect(text).toContain('8 Einheiten');
  });
});
