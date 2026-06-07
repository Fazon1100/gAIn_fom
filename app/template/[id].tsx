import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Field } from '../../components/Field';
import { xAlert } from '../../lib/presentation/alert';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ExercisePickerModal } from '../../components/ExercisePickerModal';
import { colors, spacing } from '../../constants/theme';
import { useDb } from '../../context/DbProvider';
import { CATEGORY_COLORS, getExerciseByName, type Exercise } from '../../lib/application/exercises';
import * as repo from '../../lib/data/repository';

export default function TemplateEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const templateId = Number(id);
  const router = useRouter();
  const { db } = useDb();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Awaited<
    ReturnType<typeof repo.listTemplateExercises>
  >>([]);
  const [newName, setNewName] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);

  const load = useCallback(async () => {
    if (!db || Number.isNaN(templateId)) return;
    const list = await repo.listTemplates(db);
    const t = list.find((x) => x.id === templateId);
    if (!t) {
      xAlert('Nicht gefunden', 'Dieser Plan existiert nicht.');
      router.back();
      return;
    }
    setName(t.name);
    setExercises(await repo.listTemplateExercises(db, templateId));
  }, [db, templateId, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const saveName = async () => {
    if (!db || Number.isNaN(templateId)) return;
    const n = name.trim();
    if (!n) {
      xAlert('Hinweis', 'Bitte einen Namen setzen.');
      return;
    }
    await repo.renameTemplate(db, templateId, n);
    xAlert('Gespeichert', 'Planname aktualisiert.');
  };

  const addExercise = async () => {
    if (!db || Number.isNaN(templateId)) return;
    const n = newName.trim();
    if (!n) {
      xAlert('Hinweis', 'Name der Übung eingeben.');
      return;
    }
    await repo.addTemplateExercise(db, templateId, n, null);
    setNewName('');
    load();
  };

  const addFromLibrary = async (exercise: Exercise) => {
    if (!db || Number.isNaN(templateId)) return;
    await repo.addTemplateExercise(db, templateId, exercise.name, null);
    setPickerVisible(false);
    load();
  };

  const removeExercise = (exerciseId: number, label: string) => {
    xAlert('Übung entfernen?', label, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          if (!db) return;
          await repo.deleteTemplateExercise(db, exerciseId);
          load();
        },
      },
    ]);
  };

  if (Number.isNaN(templateId)) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Ungültiger Plan.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Field label="Planname" value={name} onChangeText={setName} />
        <PrimaryButton title="Namen speichern" onPress={saveName} variant="secondary" />

        <Text style={styles.section}>Übungen (Reihenfolge = Ablauf im Training)</Text>
        {exercises.length === 0 ? (
          <Text style={styles.muted}>Noch keine Übung – unten hinzufügen.</Text>
        ) : (
          exercises.map((e, i) => {
            const libExercise = getExerciseByName(e.name);
            return (
              <View key={e.id} style={styles.exCard}>
                <View style={styles.exRow}>
                  <Text style={styles.exIdx}>{i + 1}.</Text>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => {
                      if (libExercise) router.push(`/exercise/${libExercise.id}`);
                    }}
                    disabled={!libExercise}
                  >
                    <Text style={styles.exName}>{e.name}</Text>
                    {libExercise && (
                      <Text style={styles.exHint}>Tippen für Details</Text>
                    )}
                  </Pressable>
                  <Pressable onPress={() => removeExercise(e.id, e.name)} hitSlop={8}>
                    <Text style={styles.del}>×</Text>
                  </Pressable>
                </View>
                <View style={styles.setsRepsRow}>
                  <View style={styles.setsRepsField}>
                    <Text style={styles.setsRepsLabel}>Sätze</Text>
                    <TextInput
                      style={styles.setsRepsInput}
                      keyboardType="number-pad"
                      placeholder="3"
                      placeholderTextColor={colors.muted}
                      defaultValue={e.setsCount != null ? String(e.setsCount) : ''}
                      onEndEditing={(ev) => {
                        const val = ev.nativeEvent.text.trim();
                        const num = val === '' ? null : Number(val);
                        if (num != null && Number.isNaN(num)) return;
                        repo.updateTemplateExerciseSetsReps(db!, e.id, num, e.reps);
                        load();
                      }}
                    />
                  </View>
                  <View style={styles.setsRepsField}>
                    <Text style={styles.setsRepsLabel}>Wdh.</Text>
                    <TextInput
                      style={styles.setsRepsInput}
                      placeholder="8-12"
                      placeholderTextColor={colors.muted}
                      defaultValue={e.reps ?? ''}
                      onEndEditing={(ev) => {
                        const val = ev.nativeEvent.text.trim();
                        repo.updateTemplateExerciseSetsReps(db!, e.id, e.setsCount, val || null);
                        load();
                      }}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* Aus Katalog wählen */}
        <Pressable
          style={({ pressed }) => [styles.catalogBtn, pressed && { opacity: 0.75 }]}
          onPress={() => setPickerVisible(true)}
        >
          <View style={styles.catalogBtnIcon}>
            <FontAwesome name="heartbeat" size={16} color={colors.accent} />
          </View>
          <View style={styles.catalogBtnBody}>
            <Text style={styles.catalogBtnTitle}>Aus Übungskatalog wählen</Text>
            <Text style={styles.catalogBtnSub}>38 Übungen mit Beschreibungen & Alternativen</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.muted} />
        </Pressable>

        {/* Oder manuell */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>oder manuell eingeben</Text>
          <View style={styles.dividerLine} />
        </View>
        <Field
          label="Eigene Übung"
          value={newName}
          onChangeText={setNewName}
          placeholder="z. B. Kniebeuge"
          onSubmitEditing={addExercise}
        />
        <PrimaryButton title="Übung hinzufügen" onPress={addExercise} variant="secondary" />

        <Text style={styles.hint}>
          Beim Start werden die Übungen mit der angegebenen Satzanzahl übernommen. Wdh. und Gewicht
          trägst du während des Trainings ein.
        </Text>
      </ScrollView>

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={addFromLibrary}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  muted: { color: colors.muted },
  section: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  exCard: {
    backgroundColor: colors.card,
    borderRadius: 10,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  exIdx: { color: colors.muted, width: 28, fontWeight: '600' },
  exName: { color: colors.text, fontSize: 16 },
  exHint: { color: colors.accent, fontSize: 11, marginTop: 2 },
  del: { color: colors.danger, fontSize: 22, fontWeight: '700', paddingHorizontal: 8 },
  setsRepsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  setsRepsField: { flex: 1 },
  setsRepsLabel: { color: colors.muted, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  setsRepsInput: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.text,
    fontSize: 14,
  },

  catalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14532d22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent + '44',
    padding: spacing.md,
    marginTop: spacing.md,
    gap: 12,
  },
  catalogBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogBtnBody: { flex: 1 },
  catalogBtnTitle: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  catalogBtnSub: { color: colors.muted, fontSize: 12, marginTop: 2 },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.muted, fontSize: 12 },

  hint: { color: colors.muted, marginTop: spacing.lg, lineHeight: 18, fontSize: 13 },
});
