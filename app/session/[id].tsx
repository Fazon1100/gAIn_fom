import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { xAlert } from '../../lib/presentation/alert';
import { colors, spacing } from '../../constants/theme';
import { useDb } from '../../context/DbProvider';
import { getExerciseByName } from '../../lib/application/exercises';
import type { SessionExercise, SetRow } from '../../lib/data/types';
import * as repo from '../../lib/data/repository';

type ExerciseBlock = {
  exercise: SessionExercise;
  sets: SetRow[];
};

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
      const sets = await repo.listSets(db, e.id);
      next.push({ exercise: e, sets });
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

  const addExercise = async () => {
    if (!db || Number.isNaN(sessionId)) return;
    const n = newExerciseName.trim();
    if (!n) {
      xAlert('Hinweis', 'Übungsname eingeben.');
      return;
    }
    const eid = await repo.addSessionExercise(db, sessionId, n);
    await repo.addSet(db, eid);
    setNewExerciseName('');
    load();
  };

  const addSetFor = async (exerciseId: number) => {
    if (!db) return;
    await repo.addSet(db, exerciseId);
    load();
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
          refresh();
          router.back();
        },
      },
    ]);
  };

  const abort = () => {
    xAlert(
      'Training verwerfen?',
      'Alle Eingaben zu dieser Einheit werden gelöscht.',
      [
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
      ]
    );
  };

  const deleteCompleted = () => {
    xAlert(
      'Einheit löschen?',
      'Diese abgeschlossene Trainingseinheit wird unwiderruflich gelöscht.',
      [
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
      ]
    );
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {readOnly ? (
          <Text style={styles.banner}>Diese Einheit ist abgeschlossen (nur Ansicht).</Text>
        ) : (
          <Text style={styles.lead}>
            Sätze mit Wiederholungen und Gewicht eintragen. Mit „+ Satz“ erweiterst du eine Übung.
          </Text>
        )}

        {blocks.map((b) => {
          const libEx = getExerciseByName(b.exercise.name);
          return (
          <View key={b.exercise.id} style={styles.card}>
            <Pressable
              style={styles.exTitleRow}
              onPress={() => { if (libEx) router.push(`/exercise/${libEx.id}`); }}
              disabled={!libEx}
            >
              <Text style={styles.exTitle}>{b.exercise.name}</Text>
              {libEx && (
                <FontAwesome name="info-circle" size={16} color={colors.accent} />
              )}
            </Pressable>
            <View style={styles.setHead}>
              <Text style={[styles.cellH, { flex: 0.35 }]}>Satz</Text>
              <Text style={[styles.cellH, { flex: 1 }]}>Wdh.</Text>
              <Text style={[styles.cellH, { flex: 1 }]}>kg</Text>
              <Text style={{ width: 28 }} />
            </View>
            {b.sets.map((s) => (
              <SetRowEditor
                key={s.id}
                s={s}
                readOnly={readOnly}
                onCommit={(reps, w) => persistSet(s.id, reps, w)}
                onDelete={() => removeSet(s.id)}
              />
            ))}
            {!readOnly && (
              <Pressable onPress={() => addSetFor(b.exercise.id)} style={styles.addSet}>
                <Text style={styles.addSetText}>+ Satz</Text>
              </Pressable>
            )}
          </View>
        );
        })}

        {!readOnly && (
          <>
            <Text style={styles.section}>Übung hinzufügen</Text>
            <TextInput
              placeholder="Übungsname"
              placeholderTextColor={colors.muted}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              style={styles.input}
              onSubmitEditing={addExercise}
            />
            <PrimaryButton title="Übung übernehmen" onPress={addExercise} variant="secondary" />
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
  );
}

function SetRowEditor({
  s,
  readOnly,
  onCommit,
  onDelete,
}: {
  s: SetRow;
  readOnly: boolean;
  onCommit: (reps: string, weight: string) => void;
  onDelete: () => void;
}) {
  const [reps, setReps] = useState(s.reps != null ? String(s.reps) : '');
  const [weight, setWeight] = useState(s.weightKg != null ? String(s.weightKg) : '');

  return (
    <View style={styles.setRow}>
      <Text style={[styles.cell, { flex: 0.35 }]}>{s.setIndex + 1}</Text>
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
        style={[styles.cellInput, { flex: 1 }]}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
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
  exTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  exTitle: { color: colors.text, fontSize: 18, fontWeight: '700', flex: 1 },
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
  del: { color: colors.danger, fontSize: 20, fontWeight: '700' },
  addSet: { alignSelf: 'flex-start', marginTop: 4 },
  addSetText: { color: colors.accent, fontWeight: '600' },
  section: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
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
