import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { xAlert } from '../../lib/alert';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  EXERCISES,
  type Exercise,
  type MuscleCategory,
} from '../../lib/exercises';
import { colors, spacing } from '../../constants/theme';
import { useDb } from '../../context/DbProvider';
import * as repo from '../../lib/repository';

const ALL_CATEGORIES: MuscleCategory[] = [
  'brust',
  'ruecken',
  'schultern',
  'bizeps',
  'trizeps',
  'beine',
  'core',
  'cardio',
];

const DIFFICULTY_COLORS = {
  anfaenger: '#4ade80',
  fortgeschritten: '#fbbf24',
  experte: '#f87171',
};

export default function ExercisesScreen() {
  const router = useRouter();
  const { db } = useDb();
  const [selectedCategory, setSelectedCategory] = useState<MuscleCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<Awaited<ReturnType<typeof repo.listTemplates>>>([]);

  // Multi-select state
  const [selected, setSelected] = useState<Exercise[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!db) return;
      repo.listTemplates(db).then(setTemplates);
    }, [db])
  );

  const filtered = EXERCISES.filter((ex) => {
    const matchesCategory = selectedCategory === null || ex.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      ex.name.toLowerCase().includes(q) ||
      ex.primaryMuscles.some((m) => m.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const toggleSelect = (exercise: Exercise) => {
    setSelected((prev) =>
      prev.some((e) => e.id === exercise.id)
        ? prev.filter((e) => e.id !== exercise.id)
        : [...prev, exercise]
    );
  };

  const addToExistingPlan = async (templateId: number, templateName: string) => {
    if (!db || selected.length === 0) return;
    for (const ex of selected) {
      await repo.addTemplateExercise(db, templateId, ex.name, null);
    }
    const count = selected.length;
    setSelected([]);
    setShowModal(false);
    xAlert('Hinzugefügt', `${count} Übung${count > 1 ? 'en' : ''} zu „${templateName}" hinzugefügt.`);
  };

  const createNewPlan = async () => {
    if (!db || selected.length === 0) return;
    const name = newPlanName.trim() || `Neuer Plan (${selected.length} Übungen)`;
    const templateId = await repo.createTemplate(db, name);
    for (const ex of selected) {
      await repo.addTemplateExercise(db, templateId, ex.name, null);
    }
    const count = selected.length;
    setSelected([]);
    setShowModal(false);
    setNewPlanName('');
    repo.listTemplates(db).then(setTemplates);
    xAlert('Plan erstellt', `„${name}" mit ${count} Übung${count > 1 ? 'en' : ''} erstellt.`);
  };

  const openModal = () => {
    if (selected.length === 0) {
      xAlert('Hinweis', 'Wähle zuerst Übungen aus, indem du auf das + Icon tippst.');
      return;
    }
    if (db) repo.listTemplates(db).then(setTemplates);
    setShowModal(true);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.searchBar}>
        <FontAwesome name="search" size={15} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Übung oder Muskel suchen …"
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <Pressable onPress={() => setSearchQuery('')}>
            <FontAwesome name="times-circle" size={16} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        <Pressable
          style={[styles.chip, selectedCategory === null && styles.chipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.chipText, selectedCategory === null && styles.chipTextActive]}>
            Alle
          </Text>
        </Pressable>
        {ALL_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              style={[
                styles.chip,
                isActive && { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] },
              ]}
              onPress={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {CATEGORY_LABELS[cat]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Keine Übungen gefunden.</Text>
        }
        renderItem={({ item }) => (
          <ExerciseCard
            exercise={item}
            isSelected={selected.some((e) => e.id === item.id)}
            onPress={() => router.push(`/exercise/${item.id}`)}
            onToggle={() => toggleSelect(item)}
          />
        )}
      />

      {/* Floating action bar */}
      {selected.length > 0 && (
        <View style={styles.fab}>
          <Pressable style={styles.fabClear} onPress={() => setSelected([])}>
            <FontAwesome name="times" size={14} color={colors.muted} />
          </Pressable>
          <Text style={styles.fabText}>{selected.length} ausgewählt</Text>
          <Pressable style={styles.fabBtn} onPress={openModal}>
            <FontAwesome name="plus" size={14} color="#0d0d12" />
            <Text style={styles.fabBtnText}>Zum Plan</Text>
          </Pressable>
        </View>
      )}

      {/* Plan-Auswahl Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selected.length} Übung{selected.length > 1 ? 'en' : ''} hinzufügen
              </Text>
              <Pressable onPress={() => setShowModal(false)} hitSlop={12}>
                <FontAwesome name="times" size={20} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Neuen Plan erstellen */}
              <Text style={styles.modalSection}>Neuen Plan erstellen</Text>
              <View style={styles.newPlanRow}>
                <TextInput
                  style={styles.newPlanInput}
                  value={newPlanName}
                  onChangeText={setNewPlanName}
                  placeholder="Planname (z. B. Oberkörper Tag)"
                  placeholderTextColor={colors.muted}
                />
                <Pressable style={styles.newPlanBtn} onPress={createNewPlan}>
                  <FontAwesome name="plus" size={14} color="#0d0d12" />
                </Pressable>
              </View>

              {/* Bestehende Pläne */}
              {templates.length > 0 && (
                <>
                  <Text style={styles.modalSection}>Oder zu bestehendem Plan</Text>
                  {templates.map((t) => (
                    <Pressable
                      key={t.id}
                      style={({ pressed }) => [styles.modalRow, pressed && { opacity: 0.7 }]}
                      onPress={() => addToExistingPlan(t.id, t.name)}
                    >
                      <FontAwesome name="list-alt" size={16} color={colors.accent} />
                      <Text style={styles.modalRowText}>{t.name}</Text>
                      <FontAwesome name="plus" size={14} color={colors.accent} />
                    </Pressable>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ExerciseCard({
  exercise,
  isSelected,
  onPress,
  onToggle,
}: {
  exercise: Exercise;
  isSelected: boolean;
  onPress: () => void;
  onToggle: () => void;
}) {
  const color = CATEGORY_COLORS[exercise.category];
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{exercise.name}</Text>
          <View
            style={[
              styles.diffBadge,
              { backgroundColor: DIFFICULTY_COLORS[exercise.difficulty] + '22' },
            ]}
          >
            <Text
              style={[
                styles.diffText,
                { color: DIFFICULTY_COLORS[exercise.difficulty] },
              ]}
            >
              {DIFFICULTY_LABELS[exercise.difficulty]}
            </Text>
          </View>
        </View>
        <Text style={styles.cardCategory}>
          {CATEGORY_LABELS[exercise.category]}
        </Text>
        <Text style={styles.cardMuscles} numberOfLines={1}>
          {exercise.primaryMuscles.join(', ')}
        </Text>
      </View>
      <Pressable
        style={styles.addBtn}
        onPress={(e) => { e.stopPropagation(); onToggle(); }}
        hitSlop={6}
      >
        <FontAwesome
          name={isSelected ? 'check-circle' : 'plus-circle'}
          size={22}
          color={isSelected ? colors.accent : colors.muted}
        />
      </Pressable>
      <FontAwesome name="chevron-right" size={13} color={colors.muted} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    margin: spacing.md,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: colors.text,
    height: 42,
    fontSize: 15,
  },
  categoryScroll: { flexGrow: 0, marginBottom: 4 },
  categoryContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#0d0d12', fontWeight: '600' },
  list: { padding: spacing.md, paddingTop: spacing.sm, gap: 10, paddingBottom: 100 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 48 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: colors.accent,
  },
  cardPressed: { opacity: 0.75 },
  cardAccent: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardName: { color: colors.text, fontSize: 15, fontWeight: '600', flex: 1 },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffText: { fontSize: 11, fontWeight: '600' },
  cardCategory: { color: colors.muted, fontSize: 12, marginBottom: 2 },
  cardMuscles: { color: colors.text, fontSize: 13, opacity: 0.8 },
  addBtn: { paddingHorizontal: 8 },
  chevron: { marginRight: spacing.md },

  // Floating action bar
  fab: {
    position: 'absolute',
    bottom: 20,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabClear: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  fabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  fabBtnText: { color: '#0d0d12', fontWeight: '700', fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  modalBody: { padding: spacing.md },
  modalSection: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  newPlanRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  newPlanInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  newPlanBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  modalRowText: { color: colors.text, fontSize: 16, fontWeight: '500', flex: 1 },
});
