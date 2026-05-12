import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { xAlert } from '../../lib/alert';
import { Field } from '../../components/Field';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, spacing } from '../../constants/theme';
import { useDb } from '../../context/DbProvider';
import type { GoalKind } from '../../lib/types';
import * as repo from '../../lib/repository';

const KINDS: { id: GoalKind; label: string }[] = [
  { id: 'lose_weight', label: 'Gewicht reduzieren' },
  { id: 'gain_weight', label: 'Masse / Gewicht aufbauen' },
  { id: 'other', label: 'Sonstiges Ziel' },
];

export default function GoalsScreen() {
  const { db, refreshToken } = useDb();
  const [goals, setGoals] = useState<Awaited<ReturnType<typeof repo.listGoals>>>([]);
  const [kind, setKind] = useState<GoalKind>('lose_weight');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('kg');
  const [deadline, setDeadline] = useState('');

  const load = useCallback(async () => {
    if (!db) return;
    setGoals(await repo.listGoals(db));
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, refreshToken])
  );

  const add = async () => {
    if (!db) return;
    const t = title.trim();
    if (!t) {
      xAlert('Hinweis', 'Bitte einen Titel für das Ziel eingeben.');
      return;
    }
    const tv = target.trim() === '' ? null : Number(target.replace(',', '.'));
    if (tv != null && Number.isNaN(tv)) {
      xAlert('Hinweis', 'Zielwert bitte als Zahl.');
      return;
    }
    await repo.insertGoal(db, {
      kind,
      title: t,
      targetValue: tv,
      unit: unit.trim() === '' ? null : unit.trim(),
      deadline: deadline.trim() === '' ? null : deadline.trim(),
    });
    setTitle('');
    setTarget('');
    setDeadline('');
    load();
  };

  const remove = (id: number) => {
    xAlert('Ziel löschen?', undefined, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          if (!db) return;
          await repo.deleteGoal(db, id);
          load();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Fitnessziele festhalten – z. B. Zielgewicht, Frist oder freie Formulierung.
      </Text>

      <Text style={styles.section}>Neues Ziel</Text>
      <Text style={styles.label}>Art</Text>
      <View style={styles.kindRow}>
        {KINDS.map((k) => (
          <Pressable
            key={k.id}
            onPress={() => setKind(k.id)}
            style={[styles.chip, kind === k.id && styles.chipOn]}
          >
            <Text style={[styles.chipText, kind === k.id && styles.chipTextOn]}>{k.label}</Text>
          </Pressable>
        ))}
      </View>
      <Field label="Titel" value={title} onChangeText={setTitle} placeholder="z. B. 80 kg bis Sommer" />
      <Field
        label="Zielwert (optional)"
        value={target}
        onChangeText={setTarget}
        keyboardType="decimal-pad"
      />
      <Field label="Einheit" value={unit} onChangeText={setUnit} placeholder="kg, %, km …" />
      <Field
        label="Deadline / Notiz (optional)"
        value={deadline}
        onChangeText={setDeadline}
        placeholder="z. B. 2026-08-01 oder freier Text"
      />
      <PrimaryButton title="Ziel hinzufügen" onPress={add} />

      <Text style={styles.section}>Deine Ziele</Text>
      {goals.length === 0 ? (
        <Text style={styles.muted}>Noch keine Ziele angelegt.</Text>
      ) : (
        goals.map((g) => (
          <View key={g.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{g.title}</Text>
              <Pressable onPress={() => remove(g.id)} hitSlop={8}>
                <Text style={styles.del}>Entfernen</Text>
              </Pressable>
            </View>
            <Text style={styles.cardSub}>
              {labelKind(g.kind)}
              {g.targetValue != null && ` · Ziel: ${g.targetValue}${g.unit ? ` ${g.unit}` : ''}`}
              {g.deadline ? ` · ${g.deadline}` : ''}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function labelKind(k: GoalKind) {
  const m = KINDS.find((x) => x.id === k);
  return m?.label ?? k;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  lead: { color: colors.muted, marginBottom: spacing.md, lineHeight: 20 },
  section: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  label: { color: colors.muted, fontSize: 13, marginBottom: 8 },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { borderColor: colors.accent, backgroundColor: '#14532d33' },
  chipText: { color: colors.muted, fontSize: 13 },
  chipTextOn: { color: colors.accent },
  muted: { color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '600', flex: 1, paddingRight: 8 },
  del: { color: colors.danger, fontSize: 14 },
  cardSub: { color: colors.muted, marginTop: 8, lineHeight: 18 },
});
