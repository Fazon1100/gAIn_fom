import { useCallback, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { PrimaryButton } from '../../components/PrimaryButton';
import { xAlert } from '../../lib/alert';
import { colors, spacing } from '../../constants/theme';
import { useDb } from '../../context/DbProvider';
import * as repo from '../../lib/repository';

export default function TrainScreen() {
  const { db, refreshToken } = useDb();
  const router = useRouter();
  const [active, setActive] = useState<Awaited<
    ReturnType<typeof repo.getInProgressSession>
  > | null>(null);
  const [templates, setTemplates] = useState<Awaited<
    ReturnType<typeof repo.listTemplates>
  >>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!db) return;
    const [a, t] = await Promise.all([
      repo.getInProgressSession(db),
      repo.listTemplates(db),
    ]);
    setActive(a);
    setTemplates(t);
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

  const startEmpty = async () => {
    if (!db) return;
    const existing = await repo.getInProgressSession(db);
    if (existing) {
      xAlert(
        'Aktives Training',
        'Beende oder brich das laufende Training ab, bevor du ein neues startest.'
      );
      return;
    }
    const id = await repo.createEmptySession(db, 'Freies Training');
    router.push(`/session/${id}`);
  };

  const startFromTemplate = async (templateId: number, name: string) => {
    if (!db) return;
    const existing = await repo.getInProgressSession(db);
    if (existing) {
      xAlert(
        'Aktives Training',
        'Beende oder brich das laufende Training ab, bevor du ein neues startest.'
      );
      return;
    }
    const id = await repo.createSessionFromTemplate(db, templateId, name);
    router.push(`/session/${id}`);
  };

  const resume = () => {
    if (active) router.push(`/session/${active.id}`);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <Text style={styles.brand}>gAIn</Text>
      <Text style={styles.tagline}>Gym-Tracking – später mit KI-Unterstützung erweiterbar.</Text>

      {active ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Laufendes Training</Text>
          <Text style={styles.cardSub}>
            {active.title ?? 'Training'} · gestartet {formatDt(active.startedAt)}
          </Text>
          <PrimaryButton title="Fortsetzen" onPress={resume} style={styles.mt} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Neu starten</Text>
          <PrimaryButton title="Leeres Training (ad hoc)" onPress={startEmpty} />
          <Text style={styles.hint}>
            Übungen und Sätze fügst du während der Einheit hinzu; beim Speichern wird alles
            protokolliert.
          </Text>
        </View>
      )}

      <Text style={styles.section}>Aus Workout-Plan</Text>
      {templates.length === 0 ? (
        <Text style={styles.muted}>
          Noch keine Pläne. Lege unter „Pläne“ einen eigenen Trainingsplan an.
        </Text>
      ) : (
        templates.map((t) => (
          <View key={t.id} style={styles.planRow}>
            <Pressable
              style={styles.planMain}
              onPress={() => startFromTemplate(t.id, t.name)}
              disabled={!!active}
            >
              <Text style={[styles.planName, !!active && { opacity: 0.5 }]}>{t.name}</Text>
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => {
                xAlert('Plan löschen?', `„${t.name}" wirklich entfernen?`, [
                  { text: 'Abbrechen', style: 'cancel' },
                  {
                    text: 'Löschen',
                    style: 'destructive',
                    onPress: async () => {
                      if (!db) return;
                      await repo.deleteTemplate(db, t.id);
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
    const d = new Date(iso.replace(' ', 'T'));
    return d.toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
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
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
  },
  tagline: { color: colors.muted, marginTop: 8, marginBottom: spacing.lg, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  cardSub: { color: colors.muted, marginTop: 6 },
  mt: { marginTop: spacing.md },
  hint: { color: colors.muted, marginTop: spacing.md, fontSize: 13, lineHeight: 18 },
  section: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  muted: { color: colors.muted, lineHeight: 20 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  planMain: { flex: 1 },
  planName: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
