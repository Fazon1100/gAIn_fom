import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { BarChart, type BarDatum } from '../../components/BarChart';
import { xAlert } from '../../lib/presentation/alert';
import {
  generateAnalysis,
  PROVIDER_MODELS,
  providerNeedsKey,
  type AiProvider,
} from '../../lib/application/ai';
import {
  buildQuickSummary,
  collectAnalytics,
  type AnalyticsData,
} from '../../lib/application/analysis';
import { colors, spacing } from '../../constants/theme';
import { useDb } from '../../context/DbProvider';
import * as repo from '../../lib/data/repository';
import type { ExerciseProgressPoint } from '../../lib/data/repository';

export default function ProgressScreen() {
  const { db, refreshToken, refresh } = useDb();
  const router = useRouter();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [sessions, setSessions] = useState<
    { row: Awaited<ReturnType<typeof repo.listCompletedSessions>>[0]; volume: number }[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);

  // KI-Analyse
  const [aiText, setAiText] = useState('');
  const [aiFallback, setAiFallback] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const analyzingSig = useRef<string | null>(null);

  // Übungs-Verlauf
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<ExerciseProgressPoint[]>([]);

  const runAnalysis = useCallback(
    async (d: AnalyticsData, force: boolean) => {
      if (!db || d.totalSessions === 0) {
        setAiText('');
        setAiFallback('');
        return;
      }
      const [cachedSig, cachedText] = await Promise.all([
        repo.getSetting(db, 'analysis_sig'),
        repo.getSetting(db, 'analysis_text'),
      ]);
      if (!force && cachedText && cachedSig === d.signature) {
        setAiText(cachedText);
        setAiFallback('');
        return;
      }

      const provider = ((await repo.getSetting(db, 'ai_provider')) as AiProvider) || 'offline';
      const model = (await repo.getSetting(db, 'ai_model')) || PROVIDER_MODELS[provider][0].id;
      const key = (await repo.getSetting(db, `ai_key_${provider}`)) ?? '';

      if (providerNeedsKey(provider) && !key) {
        setAiText('');
        setAiFallback(buildQuickSummary(d));
        return;
      }
      if (!force && analyzingSig.current === d.signature) return;
      analyzingSig.current = d.signature;

      setAiLoading(true);
      setAiError(null);
      try {
        const profile = await repo.getProfile(db);
        const text = await generateAnalysis(provider, key, model, d, profile);
        setAiText(text);
        setAiFallback('');
        await Promise.all([
          repo.setSetting(db, 'analysis_text', text),
          repo.setSetting(db, 'analysis_sig', d.signature),
        ]);
      } catch (e) {
        setAiError(e instanceof Error ? e.message : 'Analyse fehlgeschlagen.');
        setAiFallback(buildQuickSummary(d));
      } finally {
        setAiLoading(false);
      }
    },
    [db]
  );

  const load = useCallback(async () => {
    if (!db) return;
    const [analytics, list] = await Promise.all([
      collectAnalytics(db),
      repo.listCompletedSessions(db, 20),
    ]);
    setData(analytics);

    // Default-Übung für den Verlaufs-Chart
    const firstTrend = analytics.exerciseTrends.find((t) => t.points.length > 0);
    if (firstTrend) {
      setSelectedExercise(firstTrend.name);
      setSelectedPoints(firstTrend.points);
    } else {
      setSelectedExercise(null);
      setSelectedPoints([]);
    }

    const withVol = await Promise.all(
      list.map(async (row) => ({ row, volume: await repo.sessionVolumeKg(db, row.id) }))
    );
    setSessions(withVol);

    // KI-Analyse automatisch (mit Caching nach Daten-Signatur)
    runAnalysis(analytics, false);
  }, [db, runAnalysis]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, refreshToken])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const selectExercise = async (name: string) => {
    setSelectedExercise(name);
    if (!db) return;
    const fromTrend = data?.exerciseTrends.find((t) => t.name === name);
    if (fromTrend) {
      setSelectedPoints(fromTrend.points);
    } else {
      setSelectedPoints(await repo.exerciseProgress(db, name));
    }
  };

  if (!data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (data.totalSessions === 0) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.emptyBox}>
          <FontAwesome name="line-chart" size={36} color={colors.accent} />
          <Text style={styles.emptyTitle}>Noch keine Auswertung</Text>
          <Text style={styles.emptyText}>
            Speichere deine erste Trainingseinheit – danach erscheinen hier Statistiken, Diagramme und
            deine persönliche KI-Analyse.
          </Text>
        </View>
      </ScrollView>
    );
  }

  const weekSessionBars: BarDatum[] = data.weeks.map((w) => ({ label: w.label, value: w.sessions }));
  const weekVolumeBars: BarDatum[] = data.weeks.map((w) => ({ label: w.label, value: w.volumeKg }));
  const weekdayBars: BarDatum[] = data.weekdays.map((d) => ({ label: d.label, value: d.count }));
  const exerciseBars: BarDatum[] = selectedPoints.map((p) => ({
    label: shortDate(p.date),
    value: p.maxWeight,
    sub: `×${p.reps}`,
  }));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* ── Kennzahlen ─────────────────────────────── */}
      <View style={styles.statsGrid}>
        <StatCard icon="check" label="Einheiten" value={String(data.totalSessions)} />
        <StatCard icon="calendar" label="⌀ / Woche" value={String(data.avgSessionsPerWeek)} />
        <StatCard icon="fire" label="Serie" value={`${data.streakWeeks} Wo.`} />
        <StatCard icon="bar-chart" label="Volumen" value={abbrev(data.totalVolumeKg)} />
      </View>

      {/* ── KI-Analyse ─────────────────────────────── */}
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <View style={styles.aiTitleRow}>
            <FontAwesome name="magic" size={14} color={colors.accent} />
            <Text style={styles.aiTitle}>KI-Analyse</Text>
          </View>
          <Pressable
            onPress={() => runAnalysis(data, true)}
            hitSlop={8}
            disabled={aiLoading}
            style={styles.aiRefresh}
          >
            <FontAwesome name="refresh" size={13} color={aiLoading ? colors.muted : colors.accent} />
            <Text style={[styles.aiRefreshText, aiLoading && { color: colors.muted }]}>
              Neu
            </Text>
          </Pressable>
        </View>

        {aiLoading ? (
          <View style={styles.aiLoading}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.aiLoadingText}>gAIn analysiert deine Daten …</Text>
          </View>
        ) : aiText ? (
          <Text style={styles.aiBody}>{aiText}</Text>
        ) : (
          <Text style={styles.aiBody}>{aiFallback || 'Keine Analyse verfügbar.'}</Text>
        )}

        {aiError && <Text style={styles.aiErrorText}>{aiError}</Text>}
      </View>

      {/* ── Trainingsfrequenz ──────────────────────── */}
      <ChartCard title="Trainingsfrequenz" subtitle="Einheiten pro Woche">
        <BarChart data={weekSessionBars} height={110} format={(n) => String(Math.round(n))} />
      </ChartCard>

      {/* ── Volumen-Trend ──────────────────────────── */}
      <ChartCard title="Volumen-Trend" subtitle="kg × Wdh. pro Woche">
        <BarChart data={weekVolumeBars} height={110} accent="#45B7D1" />
      </ChartCard>

      {/* ── Wochentage ─────────────────────────────── */}
      <ChartCard title="Lieblings-Trainingstage" subtitle="Einheiten je Wochentag">
        <BarChart data={weekdayBars} height={90} accent="#A78BFA" format={(n) => String(Math.round(n))} />
      </ChartCard>

      {/* ── Muskelgruppen ──────────────────────────── */}
      {data.muscleGroups.length > 0 && (
        <ChartCard title="Muskelgruppen-Verteilung" subtitle="Anteil am Gesamtvolumen">
          {data.muscleGroups.map((m) => (
            <View key={m.category} style={styles.muscleRow}>
              <Text style={styles.muscleLabel}>{m.label}</Text>
              <View style={styles.muscleTrack}>
                <View style={[styles.muscleFill, { width: `${Math.max(2, m.pct)}%`, backgroundColor: m.color }]} />
              </View>
              <Text style={styles.musclePct}>{m.pct}%</Text>
            </View>
          ))}
        </ChartCard>
      )}

      {/* ── Übungs-Fortschritt ─────────────────────── */}
      {data.trainedExerciseNames.length > 0 && (
        <ChartCard title="Kraftverlauf" subtitle="Schwerster Satz je Einheit (kg)">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.exerciseChips}
            contentContainerStyle={styles.exerciseChipsContent}
          >
            {data.trainedExerciseNames.map((name) => (
              <Pressable
                key={name}
                style={[styles.exChip, selectedExercise === name && styles.exChipActive]}
                onPress={() => selectExercise(name)}
              >
                <Text style={[styles.exChipText, selectedExercise === name && styles.exChipTextActive]}>
                  {name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {exerciseBars.length >= 2 ? (
            <BarChart data={exerciseBars} height={110} accent="#7ee787" scrollable format={(n) => String(n)} />
          ) : (
            <Text style={styles.hint}>
              Für einen Verlauf brauchst du mindestens zwei Einheiten mit dieser Übung.
            </Text>
          )}
        </ChartCard>
      )}

      {/* ── Letzte Einheiten ───────────────────────── */}
      <Text style={styles.section}>Letzte Einheiten</Text>
      {sessions.map(({ row, volume }) => (
        <View key={row.id} style={styles.sessionRow}>
          <Pressable style={styles.sessionMain} onPress={() => router.push(`/session/${row.id}`)}>
            <Text style={styles.sessionTitle}>{row.title ?? 'Training'}</Text>
            <Text style={styles.sessionSub}>
              {row.completedAt ? formatDt(row.completedAt) : ''} · {abbrev(Math.round(volume))} kg·Wdh.
            </Text>
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() => {
              xAlert('Einheit löschen?', `„${row.title ?? 'Training'}" unwiderruflich löschen?`, [
                { text: 'Abbrechen', style: 'cancel' },
                {
                  text: 'Löschen',
                  style: 'destructive',
                  onPress: async () => {
                    if (!db) return;
                    await repo.deleteSession(db, row.id);
                    refresh();
                    load();
                  },
                },
              ]);
            }}
          >
            <FontAwesome name="trash" size={16} color={colors.danger} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <FontAwesome name={icon} size={14} color={colors.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      {subtitle && <Text style={styles.chartSubtitle}>{subtitle}</Text>}
      <View style={{ marginTop: spacing.sm }}>{children}</View>
    </View>
  );
}

function abbrev(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}k`;
  }
  return String(Math.round(n));
}

function shortDate(iso: string) {
  try {
    return new Date(iso.replace(' ', 'T')).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDt(iso: string) {
  try {
    return new Date(iso.replace(' ', 'T')).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },

  // Empty
  emptyBox: { alignItems: 'center', padding: spacing.lg, marginTop: 60, gap: 12 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 21 },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  statCard: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 74,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11 },

  // AI card
  aiCard: {
    backgroundColor: '#14532d22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent + '55',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: { color: colors.accent, fontWeight: '800', fontSize: 15 },
  aiRefresh: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  aiRefreshText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  aiLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  aiLoadingText: { color: colors.muted, fontSize: 14 },
  aiBody: { color: colors.text, fontSize: 14, lineHeight: 22 },
  aiErrorText: { color: colors.danger, fontSize: 12, marginTop: 8 },

  // Chart card
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chartTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  chartSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },

  // Muscle distribution
  muscleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  muscleLabel: { color: colors.text, fontSize: 13, width: 78 },
  muscleTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.bg, overflow: 'hidden' },
  muscleFill: { height: '100%', borderRadius: 5 },
  musclePct: { color: colors.muted, fontSize: 12, width: 36, textAlign: 'right' },

  // Exercise chips
  exerciseChips: { marginBottom: spacing.sm },
  exerciseChipsContent: { gap: 8, paddingVertical: 2 },
  exChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  exChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  exChipText: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  exChipTextActive: { color: '#0d0d12', fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 19, paddingVertical: 8 },

  // Sessions list
  section: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: spacing.sm, marginTop: spacing.sm },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionMain: { flex: 1 },
  sessionTitle: { color: colors.text, fontWeight: '600' },
  sessionSub: { color: colors.muted, marginTop: 6, fontSize: 13 },
});
