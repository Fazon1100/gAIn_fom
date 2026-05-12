import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { xAlert } from '../../lib/alert';
import { colors, spacing } from '../../constants/theme';
import { useDb } from '../../context/DbProvider';
import * as repo from '../../lib/repository';

export default function ProgressScreen() {
  const { db, refreshToken, refresh } = useDb();
  const router = useRouter();
  const [weeks, setWeeks] = useState<Awaited<ReturnType<typeof repo.progressByWeek>>>([]);
  const [sessions, setSessions] = useState<
    { row: Awaited<ReturnType<typeof repo.listCompletedSessions>>[0]; volume: number }[]
  >([]);
  const [total, setTotal] = useState(0);
  const [analysis, setAnalysis] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!db) return;
    const [w, t, list] = await Promise.all([
      repo.progressByWeek(db, 10),
      repo.countCompletedSessions(db),
      repo.listCompletedSessions(db, 30),
    ]);
    setWeeks(w);
    setTotal(t);
    const withVol = await Promise.all(
      list.map(async (row) => ({
        row,
        volume: await repo.sessionVolumeKg(db, row.id),
      }))
    );
    setSessions(withVol);
    const last = w[0];
    const prev = w[1];
    setAnalysis(
      repo.buildAnalysisText({
        totalSessions: t,
        lastWeekSessions: last?.sessionCount ?? 0,
        prevWeekSessions: prev?.sessionCount ?? 0,
        lastWeekVolume: last?.volumeKg ?? 0,
        prevWeekVolume: prev?.volumeKg ?? 0,
      })
    );
  }, [db]);

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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <Text style={styles.lead}>
        Überblick über abgeschlossene Einheiten und Volumen (kg × Wiederholungen).
      </Text>

      <View style={styles.analysis}>
        <Text style={styles.analysisTitle}>Kurzanalyse</Text>
        <Text style={styles.analysisBody}>{analysis}</Text>
      </View>

      <Text style={styles.section}>Wochenübersicht</Text>
      {weeks.length === 0 ? (
        <Text style={styles.muted}>Noch keine Daten in den letzten Wochen.</Text>
      ) : (
        weeks.map((w) => (
          <View key={w.weekStart} style={styles.row}>
            <Text style={styles.rowMain}>{w.weekStart.replace('-W', ' · W')}</Text>
            <Text style={styles.rowStat}>
              {w.sessionCount}× · {Math.round(w.volumeKg)} kg·Wdh.
            </Text>
          </View>
        ))
      )}

      <Text style={styles.section}>Letzte Einheiten ({total} gesamt)</Text>
      {sessions.length === 0 ? (
        <Text style={styles.muted}>Speichere ein Training, um die Historie zu füllen.</Text>
      ) : (
        sessions.map(({ row, volume }) => (
          <View key={row.id} style={styles.sessionRow}>
            <Pressable
              style={styles.sessionMain}
              onPress={() => router.push(`/session/${row.id}`)}
            >
              <Text style={styles.sessionTitle}>{row.title ?? 'Training'}</Text>
              <Text style={styles.sessionSub}>
                {row.completedAt ? formatDt(row.completedAt) : ''} · Volumen{' '}
                {Math.round(volume)} kg·Wdh.
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
        ))
      )}
    </ScrollView>
  );
}

function formatDt(iso: string) {
  try {
    return new Date(iso.replace(' ', 'T')).toLocaleString(undefined, {
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
  content: { padding: spacing.lg, paddingBottom: 48 },
  lead: { color: colors.muted, marginBottom: spacing.md, lineHeight: 20 },
  analysis: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  analysisTitle: { color: colors.accent, fontWeight: '700', marginBottom: 8 },
  analysisBody: { color: colors.text, lineHeight: 22 },
  section: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  muted: { color: colors.muted, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowMain: { color: colors.text, fontWeight: '500' },
  rowStat: { color: colors.muted, fontSize: 13 },
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
