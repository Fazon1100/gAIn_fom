import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, spacing } from '../constants/theme';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  EXERCISES,
  type Exercise,
  type MuscleCategory,
} from '../lib/application/exercises';

const ALL_CATEGORIES: MuscleCategory[] = [
  'brust', 'ruecken', 'schultern', 'bizeps', 'trizeps', 'beine', 'core', 'cardio',
];

const DIFFICULTY_COLORS: Record<string, string> = {
  anfaenger: '#4ade80',
  fortgeschritten: '#fbbf24',
  experte: '#f87171',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePickerModal({ visible, onClose, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MuscleCategory | null>(null);

  const filtered = EXERCISES.filter((ex) => {
    const matchCat = category === null || ex.category === category;
    const q = search.toLowerCase().trim();
    const matchSearch =
      q === '' ||
      ex.name.toLowerCase().includes(q) ||
      ex.primaryMuscles.some((m) => m.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    setSearch('');
    setCategory(null);
  };

  const handleClose = () => {
    setSearch('');
    setCategory(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Übung auswählen</Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <FontAwesome name="times" size={20} color={colors.muted} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={14} color={colors.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Übung suchen …"
            placeholderTextColor={colors.muted}
            autoFocus
          />
          {search !== '' && (
            <Pressable onPress={() => setSearch('')}>
              <FontAwesome name="times-circle" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {/* Category chips */}
        <FlatList
          data={[null, ...ALL_CATEGORIES]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          keyExtractor={(item) => item ?? 'all'}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.chip,
                item === null && category === null && styles.chipActive,
                item !== null && category === item && { backgroundColor: CATEGORY_COLORS[item] },
              ]}
              onPress={() => setCategory(item === category ? null : item)}
            >
              <Text
                style={[
                  styles.chipText,
                  (category === item) && styles.chipTextActive,
                ]}
              >
                {item === null ? 'Alle' : CATEGORY_LABELS[item]}
              </Text>
            </Pressable>
          )}
        />

        {/* Exercise list */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Keine Übungen gefunden.</Text>}
          renderItem={({ item }) => {
            const color = CATEGORY_COLORS[item.category];
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
                onPress={() => handleSelect(item)}
              >
                <View style={[styles.cardAccent, { backgroundColor: color }]} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardMuscles} numberOfLines={1}>
                    {item.primaryMuscles.join(', ')}
                  </Text>
                </View>
                <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[item.difficulty] + '22' }]}>
                  <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[item.difficulty] }]}>
                    {DIFFICULTY_LABELS[item.difficulty]}
                  </Text>
                </View>
                <FontAwesome name="plus-circle" size={20} color={colors.accent} style={{ marginLeft: 8, marginRight: spacing.md }} />
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
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
  searchInput: { flex: 1, color: colors.text, height: 40, fontSize: 15 },
  chipRow: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#0d0d12' },
  list: { padding: spacing.md, gap: 8, paddingBottom: 40 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardAccent: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: spacing.md },
  cardName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  cardMuscles: { color: colors.muted, fontSize: 12, marginTop: 2 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 11, fontWeight: '600' },
});
