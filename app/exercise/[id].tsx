import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  getAlternatives,
  getExerciseById,
  type Exercise,
} from '../../lib/exercises';
import { colors, spacing } from '../../constants/theme';

const EQUIPMENT_LABELS: Record<string, string> = {
  langhantel: 'Langhantel',
  kurzhantel: 'Kurzhantel',
  kabel: 'Kabelzug',
  maschine: 'Maschine',
  koerpergewicht: 'Körpergewicht',
  kettlebell: 'Kettlebell',
  stange: 'Stange / Rack',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  anfaenger: '#4ade80',
  fortgeschritten: '#fbbf24',
  experte: '#f87171',
};

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const exercise = getExerciseById(id ?? '');

  if (!exercise) {
    return (
      <View style={styles.screen}>
        <Text style={styles.notFound}>Übung nicht gefunden.</Text>
      </View>
    );
  }

  const catColor = CATEGORY_COLORS[exercise.category];
  const alternatives = getAlternatives(exercise);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
        <View style={[styles.categoryPill, { backgroundColor: catColor }]}>
          <Text style={styles.categoryPillText}>{CATEGORY_LABELS[exercise.category]}</Text>
        </View>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        {exercise.nameEn !== exercise.name && (
          <Text style={styles.exerciseNameEn}>{exercise.nameEn}</Text>
        )}
        <View style={styles.badges}>
          <View
            style={[
              styles.badge,
              { backgroundColor: DIFFICULTY_COLORS[exercise.difficulty] + '22' },
            ]}
          >
            <Text style={[styles.badgeText, { color: DIFFICULTY_COLORS[exercise.difficulty] }]}>
              {DIFFICULTY_LABELS[exercise.difficulty]}
            </Text>
          </View>
          {exercise.equipment.map((eq) => (
            <View key={eq} style={styles.badge}>
              <Text style={styles.badgeText}>{EQUIPMENT_LABELS[eq] ?? eq}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.descriptionText}>{exercise.description}</Text>
      </View>

      {/* Muscles */}
      <View style={styles.section}>
        <SectionTitle icon="bullseye" title="Muskeln" />
        <View style={styles.muscleRow}>
          <Text style={styles.muscleLabel}>Primär</Text>
          <View style={styles.muscleTags}>
            {exercise.primaryMuscles.map((m) => (
              <View key={m} style={[styles.muscleTag, { borderColor: catColor }]}>
                <Text style={[styles.muscleTagText, { color: catColor }]}>{m}</Text>
              </View>
            ))}
          </View>
        </View>
        {exercise.secondaryMuscles.length > 0 && (
          <View style={styles.muscleRow}>
            <Text style={styles.muscleLabel}>Sekundär</Text>
            <View style={styles.muscleTags}>
              {exercise.secondaryMuscles.map((m) => (
                <View key={m} style={styles.muscleTagMuted}>
                  <Text style={styles.muscleTagTextMuted}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <SectionTitle icon="list-ol" title="Ausführung" />
        {exercise.instructions.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: catColor }]}>
              <Text style={styles.stepNumberText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Tips */}
      {exercise.tips.length > 0 && (
        <View style={styles.section}>
          <SectionTitle icon="lightbulb-o" title="Tipps" color={colors.accent} />
          {exercise.tips.map((tip, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.accent }]}>✓</Text>
              <Text style={styles.bulletText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Common Mistakes */}
      {exercise.commonMistakes.length > 0 && (
        <View style={styles.section}>
          <SectionTitle icon="exclamation-triangle" title="Häufige Fehler" color={colors.danger} />
          {exercise.commonMistakes.map((mistake, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.danger }]}>✗</Text>
              <Text style={styles.bulletText}>{mistake}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <View style={styles.section}>
          <SectionTitle icon="refresh" title="Alternative Übungen" />
          {alternatives.map((alt) => (
            <AlternativeCard
              key={alt.id}
              exercise={alt}
              onPress={() => router.replace(`/exercise/${alt.id}`)}
            />
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SectionTitle({
  icon,
  title,
  color,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  color?: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <FontAwesome name={icon} size={14} color={color ?? colors.muted} />
      <Text style={[styles.sectionTitleText, color ? { color } : {}]}>{title}</Text>
    </View>
  );
}

function AlternativeCard({
  exercise,
  onPress,
}: {
  exercise: Exercise;
  onPress: () => void;
}) {
  const catColor = CATEGORY_COLORS[exercise.category];
  return (
    <Pressable
      style={({ pressed }) => [styles.altCard, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={[styles.altAccent, { backgroundColor: catColor }]} />
      <View style={styles.altBody}>
        <Text style={styles.altName}>{exercise.name}</Text>
        <Text style={styles.altMuscles}>{exercise.primaryMuscles.join(', ')}</Text>
      </View>
      <FontAwesome name="chevron-right" size={12} color={colors.muted} style={{ marginRight: spacing.md }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  notFound: { color: colors.muted, textAlign: 'center', marginTop: 60 },

  header: {
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  categoryPillText: { color: '#0d0d12', fontSize: 12, fontWeight: '700' },
  exerciseName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  exerciseNameEn: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  badgeText: { color: colors.muted, fontSize: 12, fontWeight: '500' },

  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionTitleText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  descriptionText: { color: colors.text, fontSize: 15, lineHeight: 22 },

  muscleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  muscleLabel: { color: colors.muted, fontSize: 12, width: 60, paddingTop: 4 },
  muscleTags: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muscleTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  muscleTagText: { fontSize: 12, fontWeight: '600' },
  muscleTagMuted: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  muscleTagTextMuted: { color: colors.muted, fontSize: 12 },

  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: { color: '#0d0d12', fontSize: 12, fontWeight: '700' },
  stepText: { color: colors.text, fontSize: 14, lineHeight: 21, flex: 1 },

  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  bullet: { fontSize: 14, fontWeight: '700', width: 16 },
  bulletText: { color: colors.text, fontSize: 14, lineHeight: 21, flex: 1 },

  altCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  altAccent: { width: 4, alignSelf: 'stretch' },
  altBody: { flex: 1, padding: spacing.md },
  altName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  altMuscles: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
