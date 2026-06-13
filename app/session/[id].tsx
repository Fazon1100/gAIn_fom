import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ExercisePickerModal } from '../../components/ExercisePickerModal';
import { RestTimer } from '../../components/RestTimer';
import { xAlert } from '../../lib/presentation/alert';
import { colors, spacing } from '../../constants/theme';
import { useDb } from '../../context/DbProvider';
import { getExerciseByName, type Exercise } from '../../lib/application/exercises';
import type { LastPerformance } from '../../lib/data/repository';
import type { SessionExercise, SetRow } from '../../lib/data/types';
import * as repo from '../../lib/data/repository';

type ExerciseBlock = {
  exercise: SessionExercise;
  sets: SetRow[];
  lastPerf: LastPerformance | null;
  prevMax: number | null;
};

const REST_SECONDS = 90;

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const router = useRouter();
  const navigation = useNavigation();
  const { db, refresh } = useDb();
  const [title, setTitle] = useState<string | null>(null);
  const [status, setStatus] = useState<'in_progress' | 'completed' | null>(null);
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [rest, setRest] = useState<{ seconds: number; nonce: number } | null>(null);

  const load = useCallback(async () => {
    if (!db || Number.isNaN(sessionId)) return;
    const s = await repo.getSession(db, sessionId);
    if (!s) {
      xAlert('Fehlt', 'Training nicht gefunden.');
      router.back();
      return;
    }
    setTitle(s.title);
    setStatus(s.status);
    const ex = await repo.listSessionExercises(db, sessionId);
    const next: ExerciseBlock[] = [];
    for (const e of ex) {
      const [sets, lastPerf, prevMax] = await Promise.all([
        repo.listSets(db, e.id),
        repo.lastExercisePerformance(db, e.name),
        repo.exerciseMaxWeight(db, e.name),
      ]);
      next.push({ exercise: e, sets, lastPerf, prevMax });
    }
    setBlocks(next);
  }, [db, sessionId, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: title ?? 'Training' });
  }, [navigation, title]);

  const persistSet = async (setId: number, reps: string, weight: string) => {
    if (!db) return;
    const r = reps.trim() === '' ? null : Math.round(Number(reps.replace(',', '.')));
    const w = weight.trim() === '' ? null : Number(weight.replace(',', '.'));
    if (r != null && Number.isNaN(r)) return;
    if (w != null && Number.isNaN(w)) return;
    await repo.updateSet(db, setId, r, w);
  };

  const addExerciseByName = async (name: string) => {
    if (!db || Number.isNaN(sessionId)) return;
    const eid = await repo.addSessionExercise(db, sessionId, name);
    await repo.addSet(db, eid);
    load();
  };

  const addManual = async () => {
    const n = newExerciseName.trim();
    if (!n) {
      xAlert('Hinweis', 'Übungsname eingeben.');
      return;
    }
    setNewExerciseName('');
    await addExerciseByName(n);
  };

  const removeExercise = (exerciseId: number, name: string) => {
    xAlert('Übung entfernen?', `„${name}" aus dieser Einheit entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Entfernen',
        style: 'destructive',
        onPress: async () => {
          if (!db) return;
          await repo.deleteSessionExercise(db, exerciseId);
          load();
        },
      },
    ]);
  };

  const addSetFor = async (exerciseId: number) => {
    if (!db) return;
    await repo.addSet(db, exerciseId);
    load();
  };

  const startRest = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRest((prev) => ({ seconds: REST_SECONDS, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  const removeSet = (setId: number) => {
    xAlert('Satz löschen?', undefined, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          if (!db) return;
          await repo.deleteSet(db, setId);
          load();
        },
      },
    ]);
  };

  const finish = () => {
    xAlert('Training beenden?', 'Die Einheit wird als abgeschlossen gespeichert.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Speichern',
        onPress: async () => {
          if (!db || Number.isNaN(sessionId)) return;
          await repo.completeSession(db, sessionId);
          if (Platform.OS !== 'web')
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          refresh();
          router.back();
        },
      },
    ]);
  };

  const abort = () => {
    xAlert('Training verwerfen?', 'Alle Eingaben zu dieser Einheit werden gelöscht.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Verwerfen',
        style: 'destructive',
        onPress: async () => {
          if (!db || Number.isNaN(sessionId)) return;
          await repo.abandonSession(db, sessionId);
          refresh();
          router.back();
        },
      },
    ]);
  };

  const deleteCompleted = () => {
    xAlert('Einheit löschen?', 'Diese abgeschlossene Trainingseinheit wird unwiderruflich gelöscht.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          if (!db || Number.isNaN(sessionId)) return;
          await repo.deleteSession(db, sessionId);
          refresh();
          router.back();
        },
      },
    ]);
  };

  if (Number.isNaN(sessionId)) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Ungültige Sitzung.</Text>
      </View>
    );
  }

  const readOnly = status === 'completed';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {readOnly ? (
          <Text style={styles.banner}>Diese Einheit ist abgeschlossen (nur Ansicht).</Text>
        ) : (
          <Text style={styles.lead}>
            Sätze mit Wiederholungen und Gewicht eintragen. „Pause" startet die Erholungsuhr.
          </Text>
        )}

        {blocks.map((b) => {
          const libEx = getExerciseByName(b.exercise.name);
          const isPr = (s: SetRow) =>
            b.prevMax != null && s.weightKg != null && s.weightKg > b.prevMax;
          const hasPr = b.sets.some(isPr);
          return (
            <View key={b.exercise.id} style={styles.card}>
              <View style={styles.exTitleRow}>
                <Pressable
                  style={styles.exTitlePress}
                  onPress={() => {
                    if (libEx) router.push(`/exercise/${libEx.id}`);
                  }}
                  disabled={!libEx}
                >
                  <Text style={styles.exTitle}>{b.exercise.name}</Text>
                  {libEx && <FontAwesome name="info-circle" size={15} color={colors.accent} />}
                </Pressable>
                {hasPr && (
                  <View style={styles.prBadge}>
                    <FontAwesome name="trophy" size={11} color="#0d0d12" />
                    <Text style={styles.prBadgeText}>Rekord</Text>
                  </View>
                )}
                {!readOnly && (
                  <Pressable onPress={() => removeExercise(b.exercise.id, b.exercise.name)} hitSlop={8}>
                    <FontAwesome name="trash" size={14} color={colors.danger} />
                  </Pressable>
                )}
              </View>

              {b.lastPerf && (
                <Text style={styles.lastPerf}>
                  Letztes Mal: {b.lastPerf.weightKg} kg × {b.lastPerf.reps} · {shortDate(b.lastPerf.date)}
                </Text>
              )}

              <View style={styles.setHead}>
                <Text style={[styles.cellH, { flex: 0.4 }]}>Satz</Text>
                <Text style={[styles.cellH, { flex: 1 }]}>Wdh.</Text>
                <Text style={[styles.cellH, { flex: 1 }]}>kg</Text>
                <Text style={{ width: 28 }} />
              </View>
              {b.sets.map((s) => (
                <SetRowEditor
                  key={s.id}
                  s={s}
                  readOnly={readOnly}
                  isPr={isPr(s)}
                  onCommit={(reps, w) => persistSet(s.id, reps, w)}
                  onDelete={() => removeSet(s.id)}
                />
              ))}
              {!readOnly && (
                <View style={styles.blockActions}>
                  <Pressable onPress={() => addSetFor(b.exercise.id)} style={styles.smallBtn}>
                    <FontAwesome name="plus" size={11} color={colors.accent} />
                    <Text style={styles.smallBtnText}>Satz</Text>
                  </Pressable>
                  <Pressable onPress={startRest} style={styles.smallBtn}>
                    <FontAwesome name="clock-o" size={11} color={colors.accent} />
                    <Text style={styles.smallBtnText}>Pause</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        {!readOnly && (
          <>
            <Text style={styles.section}>Übung hinzufügen</Text>
            <Pressable
              style={({ pressed }) => [styles.catalogBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setPickerVisible(true)}
            >
              <FontAwesome name="heartbeat" size={16} color={colors.accent} />
              <Text style={styles.catalogBtnText}>Aus Übungskatalog wählen</Text>
              <FontAwesome name="chevron-right" size={13} color={colors.muted} />
            </Pressable>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>oder manuell</Text>
              <View style={styles.dividerLine} />
            </View>
            <TextInput
              placeholder="Übungsname"
              placeholderTextColor={colors.muted}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              style={styles.input}
              onSubmitEditing={addManual}
            />
            <PrimaryButton title="Übung übernehmen" onPress={addManual} variant="secondary" />
          </>
        )}

        {!readOnly && (
          <View style={styles.actions}>
            <PrimaryButton title="Training speichern & beenden" onPress={finish} />
            <PrimaryButton title="Abbrechen & verwerfen" onPress={abort} variant="danger" />
          </View>
        )}

        {readOnly && (
          <View style={styles.actions}>
            <PrimaryButton title="Einheit löschen" onPress={deleteCompleted} variant="danger" />
          </View>
        )}
      </ScrollView>

      {rest && (
        <RestTimer key={rest.nonce} seconds={rest.seconds} onClose={() => setRest(null)} />
      )}

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(ex: Exercise) => {
          setPickerVisible(false);
          addExerciseByName(ex.name);
        }}
      />
    </View>
  );
}

function SetRowEditor({
  s,
  readOnly,
  isPr,
  onCommit,
  onDelete,
}: {
  s: SetRow;
  readOnly: boolean;
  isPr: boolean;
  onCommit: (reps: string, weight: string) => void;
  onDelete: () => void;
}) {
  const [reps, setReps] = useState(s.reps != null ? String(s.reps) : '');
  const [weight, setWeight] = useState(s.weightKg != null ? String(s.weightKg) : '');

  return (
    <View style={styles.setRow}>
      <View style={{ flex: 0.4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={styles.cell}>{s.setIndex + 1}</Text>
        {isPr && <FontAwesome name="trophy" size={11} color={colors.accent} />}
      </View>
      <TextInput
        style={[styles.cellInput, { flex: 1 }]}
        keyboardType="number-pad"
        value={reps}
        editable={!readOnly}
        onChangeText={setReps}
        onEndEditing={() => onCommit(reps, weight)}
        placeholder="–"
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={[styles.cellInput, { flex: 1 }, isPr && styles.cellInputPr]}
        keyboardType="decimal-pad"
        value={weight}
        editable={!readOnly}
        onChangeText={setWeight}
        onEndEditing={() => onCommit(reps, weight)}
        placeholder="–"
        placeholderTextColor={colors.muted}
      />
      {!readOnly ? (
        <Pressable onPress={onDelete} hitSlop={8} style={{ width: 28, alignItems: 'center' }}>
          <Text style={styles.del}>×</Text>
        </Pressable>
      ) : (
        <View style={{ width: 28 }} />
      )}
    </View>
  );
}

function shortDate(iso: string) {
  try {
    return new Date(iso.replace(' ', 'T')).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 90 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  muted: { color: colors.muted },
  banner: {
    backgroundColor: '#422006',
    color: colors.warn,
    padding: 12,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  lead: { color: colors.muted, marginBottom: spacing.md, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  exTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  exTitlePress: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  exTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  prBadgeText: { color: '#0d0d12', fontSize: 11, fontWeight: '800' },
  lastPerf: { color: colors.muted, fontSize: 12, marginBottom: spacing.sm },
  setHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cellH: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cell: { color: colors.text, fontSize: 15 },
  cellInput: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
    marginHorizontal: 4,
  },
  cellInputPr: { borderColor: colors.accent },
  del: { color: colors.danger, fontSize: 20, fontWeight: '700' },
  blockActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  smallBtnText: { color: colors.accent, fontWeight: '600', fontSize: 13 },
  section: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  catalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#14532d22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent + '44',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  catalogBtnText: { color: colors.accent, fontSize: 15, fontWeight: '700', flex: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.muted, fontSize: 12 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  actions: { marginTop: spacing.lg, gap: 12 },
});
