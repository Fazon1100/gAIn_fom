import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field } from '../components/Field';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../constants/theme';
import { useDb } from '../context/DbProvider';
import * as repo from '../lib/data/repository';

const STEPS = ['Willkommen', 'Profil', 'Dein Ziel', 'KI-Coach'];
const LAST = STEPS.length - 1;

export default function Onboarding() {
  const router = useRouter();
  const { db, refresh } = useDb();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalNote, setGoalNote] = useState('');

  const next = () => setStep((s) => Math.min(s + 1, LAST));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!db) {
      router.replace('/(tabs)/train');
      return;
    }
    const h = height.trim() === '' ? null : Number(height.replace(',', '.'));
    const w = weight.trim() === '' ? null : Number(weight.replace(',', '.'));
    const gt = goalTarget.trim() === '' ? null : Number(goalTarget.replace(',', '.'));
    await repo.saveProfile(db, {
      displayName: name.trim() || 'Athlet',
      heightCm: h != null && !Number.isNaN(h) ? h : null,
      weightKg: w != null && !Number.isNaN(w) ? w : null,
      notes: null,
    });
    await repo.saveGoal(db, {
      title: goalTitle.trim() === '' ? null : goalTitle.trim(),
      targetWeight: gt != null && !Number.isNaN(gt) ? gt : null,
      note: goalNote.trim() === '' ? null : goalNote.trim(),
    });
    await repo.setSetting(db, 'ai_provider', 'offline');
    await repo.setSetting(db, 'ai_model', 'offline-coach');
    await repo.setSetting(db, 'onboarding_done', '1');
    refresh();
    router.replace('/(tabs)/train');
  };

  const onPrimary = () => {
    if (step < LAST) next();
    else finish();
  };
  const primaryTitle = step === 0 ? "Los geht's" : step < LAST ? 'Weiter' : 'Fertig & starten';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      {/* Fortschrittsanzeige */}
      <View style={styles.progress}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
        ))}
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepWrap}>
            {step === 0 && (
              <View style={styles.welcome}>
                <Text style={styles.brand}>gAIn</Text>
                <Text style={styles.welcomeSub}>
                  Dein smarter Trainingsbegleiter – plane Workouts, tracke jeden Satz und erhalte eine
                  KI-gestützte Auswertung deines Fortschritts.
                </Text>
                <View style={styles.features}>
                  <Feature icon="list-alt" text="Trainingspläne – selbst oder von der KI erstellt" />
                  <Feature icon="bolt" text="Einheiten live tracken (Sätze, Wdh., Gewicht)" />
                  <Feature icon="line-chart" text="Statistiken, Diagramme & KI-Analyse" />
                  <Feature icon="magic" text="KI-Coach – funktioniert auch offline" />
                </View>
              </View>
            )}

            {step === 1 && (
              <View>
                <StepHeader title="Erzähl uns von dir" sub="Optional – hilft der KI, dich besser zu beraten." />
                <Field label="Name" value={name} onChangeText={setName} placeholder="z. B. Max" />
                <Field label="Größe (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="z. B. 180" />
                <Field label="Gewicht (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="z. B. 80" />
              </View>
            )}

            {step === 2 && (
              <View>
                <StepHeader title="Was ist dein Ziel?" sub="Du verfolgst ein Hauptziel. Die KI richtet alles danach aus." />
                <Field label="Titel" value={goalTitle} onChangeText={setGoalTitle} placeholder="z. B. 85 kg & stärker werden" />
                <Field label="Zielgewicht (kg)" value={goalTarget} onChangeText={setGoalTarget} keyboardType="decimal-pad" placeholder="optional" />
                <Field
                  label="Beschreibung für die KI"
                  value={goalNote}
                  onChangeText={setGoalNote}
                  multiline
                  placeholder="Zeitrahmen, Motivation, Schwerpunkte …"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              </View>
            )}

            {step === 3 && (
              <View>
                <StepHeader title="Dein KI-Coach ist startklar" sub="Standardmäßig läuft der Offline-Coach – ohne Schlüssel, ohne Internet." />
                <View style={styles.aiCard}>
                  <FontAwesome name="check-circle" size={20} color={colors.accent} />
                  <Text style={styles.aiCardText}>
                    Der <Text style={styles.bold}>Offline-Coach</Text> ist aktiv und beantwortet Fragen zu
                    Training & Ernährung sofort. Für noch ausführlichere Antworten kannst du später im
                    Profil einen kostenlosen KI-Anbieter (Google Gemini oder Groq) hinterlegen.
                  </Text>
                </View>
              </View>
            )}
          </View>
      </ScrollView>

      {/* Aktionen – fester Footer außerhalb des ScrollViews (auf iOS zuverlässig tappbar) */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton title={primaryTitle} onPress={onPrimary} />
        {step > 0 && (
          <Pressable onPress={back} style={styles.backLink} hitSlop={10}>
            <Text style={styles.backText}>Zurück</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Feature({ icon, text }: { icon: React.ComponentProps<typeof FontAwesome>['name']; text: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <FontAwesome name={icon} size={15} color={colors.accent} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={styles.stepHeader}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  progress: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingBottom: spacing.sm },
  dot: { width: 28, height: 4, borderRadius: 2, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent },
  content: { padding: spacing.lg, flexGrow: 1 },
  stepWrap: { flex: 1, justifyContent: 'center', minHeight: 320 },

  welcome: { alignItems: 'center' },
  brand: { fontSize: 52, fontWeight: '800', color: colors.accent, letterSpacing: 1, marginBottom: spacing.md },
  welcomeSub: { color: colors.muted, fontSize: 15, lineHeight: 23, textAlign: 'center', marginBottom: spacing.lg },
  features: { gap: 14, alignSelf: 'stretch', marginTop: spacing.sm },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 },

  stepHeader: { marginBottom: spacing.lg },
  stepTitle: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  stepSub: { color: colors.muted, fontSize: 14, lineHeight: 21 },

  aiCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: '#14532d22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent + '55',
    padding: spacing.md,
  },
  aiCardText: { color: colors.text, fontSize: 14, lineHeight: 21, flex: 1 },
  bold: { fontWeight: '700', color: colors.accent },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  backLink: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 24 },
  backText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
});
