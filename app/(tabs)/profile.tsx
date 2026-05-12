import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { xAlert } from '../../lib/alert';
import { Field } from '../../components/Field';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, spacing } from '../../constants/theme';
import { useDb } from '../../context/DbProvider';
import {
  PROVIDER_DESCRIPTIONS,
  PROVIDER_KEY_PLACEHOLDER,
  PROVIDER_LABELS,
  PROVIDER_MODELS,
  type AiProvider,
} from '../../lib/ai';
import type { GoalKind } from '../../lib/types';
import * as repo from '../../lib/repository';

const GOAL_KINDS: { id: GoalKind; label: string }[] = [
  { id: 'lose_weight', label: 'Gewicht reduzieren' },
  { id: 'gain_weight', label: 'Masse aufbauen' },
  { id: 'other', label: 'Sonstiges' },
];

const ALL_PROVIDERS: AiProvider[] = ['gemini', 'groq', 'anthropic'];

export default function ProfileScreen() {
  const { db, refreshToken } = useDb();

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');

  // AI Settings
  const [provider, setProvider] = useState<AiProvider>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [modelId, setModelId] = useState<string>('gemini-2.0-flash');

  // Goals
  const [goals, setGoals] = useState<Awaited<ReturnType<typeof repo.listGoals>>>([]);
  const [goalKind, setGoalKind] = useState<GoalKind>('lose_weight');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalUnit, setGoalUnit] = useState('kg');
  const [goalDeadline, setGoalDeadline] = useState('');

  const loadKeyForProvider = useCallback(async (p: AiProvider) => {
    if (!db) return '';
    const key = await repo.getSetting(db, `ai_key_${p}`);
    return key ?? '';
  }, [db]);

  const load = useCallback(async () => {
    if (!db) return;
    const [p, savedProvider, savedModel, g] = await Promise.all([
      repo.getProfile(db),
      repo.getSetting(db, 'ai_provider'),
      repo.getSetting(db, 'ai_model'),
      repo.listGoals(db),
    ]);
    setDisplayName(p.displayName);
    setHeightCm(p.heightCm != null ? String(p.heightCm) : '');
    setWeightKg(p.weightKg != null ? String(p.weightKg) : '');
    setNotes(p.notes ?? '');
    const prov = (savedProvider as AiProvider) || 'gemini';
    setProvider(prov);
    if (savedModel) setModelId(savedModel);
    setGoals(g);
    setApiKey(await loadKeyForProvider(prov));
  }, [db, loadKeyForProvider]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, refreshToken])
  );

  const handleProviderChange = async (p: AiProvider) => {
    // Save current key before switching
    if (db && apiKey.trim()) {
      await repo.setSetting(db, `ai_key_${provider}`, apiKey.trim());
    }
    setProvider(p);
    setModelId(PROVIDER_MODELS[p][0].id);
    setApiKey(await loadKeyForProvider(p));
  };

  const saveProfile = async () => {
    if (!db) return;
    const h = heightCm.trim() === '' ? null : Number(heightCm.replace(',', '.'));
    const w = weightKg.trim() === '' ? null : Number(weightKg.replace(',', '.'));
    if (h != null && Number.isNaN(h)) {
      xAlert('Hinweis', 'Größe bitte als Zahl eingeben (cm).');
      return;
    }
    if (w != null && Number.isNaN(w)) {
      xAlert('Hinweis', 'Gewicht bitte als Zahl eingeben (kg).');
      return;
    }
    await repo.saveProfile(db, {
      displayName: displayName.trim() || 'Athlet',
      heightCm: h,
      weightKg: w,
      notes: notes.trim() === '' ? null : notes.trim(),
    });
    xAlert('Gespeichert', 'Profil wurde aktualisiert.');
  };

  const saveAiSettings = async () => {
    if (!db) return;
    const key = apiKey.trim();
    if (!key) {
      xAlert('Hinweis', 'Bitte einen API-Schlüssel eingeben.');
      return;
    }
    await Promise.all([
      repo.setSetting(db, `ai_key_${provider}`, key),
      repo.setSetting(db, 'ai_provider', provider),
      repo.setSetting(db, 'ai_model', modelId),
    ]);
    xAlert('Gespeichert', `${PROVIDER_LABELS[provider]} ist jetzt aktiv. Du kannst den KI Coach nutzen!`);
  };

  const addGoal = async () => {
    if (!db) return;
    const t = goalTitle.trim();
    if (!t) {
      xAlert('Hinweis', 'Bitte einen Titel für das Ziel eingeben.');
      return;
    }
    const tv = goalTarget.trim() === '' ? null : Number(goalTarget.replace(',', '.'));
    if (tv != null && Number.isNaN(tv)) {
      xAlert('Hinweis', 'Zielwert bitte als Zahl.');
      return;
    }
    await repo.insertGoal(db, {
      kind: goalKind,
      title: t,
      targetValue: tv,
      unit: goalUnit.trim() === '' ? null : goalUnit.trim(),
      deadline: goalDeadline.trim() === '' ? null : goalDeadline.trim(),
    });
    setGoalTitle('');
    setGoalTarget('');
    setGoalDeadline('');
    setGoals(await repo.listGoals(db));
  };

  const removeGoal = (id: number) => {
    xAlert('Ziel löschen?', undefined, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          if (!db) return;
          await repo.deleteGoal(db, id);
          setGoals(await repo.listGoals(db));
        },
      },
    ]);
  };

  const currentModels = PROVIDER_MODELS[provider];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* ── Profil ─────────────────────────────────── */}
      <SectionHeader icon="user" title="Mein Profil" />
      <View style={styles.card}>
        <Field label="Anzeigename" value={displayName} onChangeText={setDisplayName} />
        <Field
          label="Größe (cm)"
          value={heightCm}
          onChangeText={setHeightCm}
          keyboardType="decimal-pad"
          placeholder="z. B. 178"
        />
        <Field
          label="Gewicht (kg)"
          value={weightKg}
          onChangeText={setWeightKg}
          keyboardType="decimal-pad"
          placeholder="optional"
        />
        <Field
          label="Notizen"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="z. B. Verletzungen, Präferenzen …"
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
        <PrimaryButton title="Profil speichern" onPress={saveProfile} />
      </View>

      {/* ── KI-Einstellungen ───────────────────────── */}
      <SectionHeader icon="magic" title="KI Coach – Einstellungen" />
      <View style={styles.card}>

        {/* Provider Auswahl */}
        <Text style={styles.fieldLabel}>KI-Anbieter wählen</Text>
        {ALL_PROVIDERS.map((p) => (
          <Pressable
            key={p}
            style={[styles.providerRow, provider === p && styles.providerRowActive]}
            onPress={() => handleProviderChange(p)}
          >
            <View style={styles.providerRadio}>
              {provider === p && <View style={styles.providerRadioDot} />}
            </View>
            <View style={styles.providerInfo}>
              <Text style={[styles.providerName, provider === p && styles.providerNameActive]}>
                {PROVIDER_LABELS[p]}
              </Text>
              <Text style={styles.providerDesc}>{PROVIDER_DESCRIPTIONS[p]}</Text>
            </View>
            {(p === 'gemini' || p === 'groq') && (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>GRATIS</Text>
              </View>
            )}
          </Pressable>
        ))}

        {/* API Key */}
        <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
          API-Schlüssel für {PROVIDER_LABELS[provider]}
        </Text>
        <Text style={styles.helpText}>
          {provider === 'gemini' && (
            <>Kostenlos unter <Text style={styles.link}>aistudio.google.com</Text> → „Get API key"</>
          )}
          {provider === 'groq' && (
            <>Kostenlos unter <Text style={styles.link}>console.groq.com</Text> → „API Keys"</>
          )}
          {provider === 'anthropic' && (
            <>Bezahlt unter <Text style={styles.link}>console.anthropic.com</Text> → „API Keys"</>
          )}
        </Text>
        <View style={styles.apiKeyRow}>
          <TextInput
            style={styles.apiKeyInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={PROVIDER_KEY_PLACEHOLDER[provider]}
            placeholderTextColor={colors.muted}
            secureTextEntry={!apiKeyVisible}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.eyeBtn} onPress={() => setApiKeyVisible((v) => !v)}>
            <FontAwesome name={apiKeyVisible ? 'eye-slash' : 'eye'} size={16} color={colors.muted} />
          </Pressable>
        </View>

        {/* Modell */}
        <Text style={styles.fieldLabel}>Modell</Text>
        <View style={styles.modelPicker}>
          {currentModels.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.modelBtn, modelId === m.id && styles.modelBtnActive]}
              onPress={() => setModelId(m.id)}
            >
              <Text style={[styles.modelBtnText, modelId === m.id && styles.modelBtnTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton title="KI-Einstellungen speichern" onPress={saveAiSettings} />
      </View>

      {/* ── Ziele ──────────────────────────────────── */}
      <SectionHeader icon="bullseye" title="Meine Ziele" />
      <View style={styles.card}>
        <Text style={styles.helpText}>Neues Fitnessziel anlegen</Text>
        <Text style={styles.fieldLabel}>Art des Ziels</Text>
        <View style={styles.kindRow}>
          {GOAL_KINDS.map((k) => (
            <Pressable
              key={k.id}
              onPress={() => setGoalKind(k.id)}
              style={[styles.chip, goalKind === k.id && styles.chipOn]}
            >
              <Text style={[styles.chipText, goalKind === k.id && styles.chipTextOn]}>
                {k.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field
          label="Titel"
          value={goalTitle}
          onChangeText={setGoalTitle}
          placeholder="z. B. 80 kg bis Sommer"
        />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field
              label="Zielwert"
              value={goalTarget}
              onChangeText={setGoalTarget}
              keyboardType="decimal-pad"
              placeholder="optional"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Einheit"
              value={goalUnit}
              onChangeText={setGoalUnit}
              placeholder="kg, %, km …"
            />
          </View>
        </View>
        <Field
          label="Deadline / Notiz"
          value={goalDeadline}
          onChangeText={setGoalDeadline}
          placeholder="z. B. 2026-12-31 oder freier Text"
        />
        <PrimaryButton title="Ziel hinzufügen" onPress={addGoal} variant="secondary" />
      </View>

      {goals.length > 0 && (
        <View style={styles.goalsList}>
          {goals.map((g) => (
            <View key={g.id} style={styles.goalCard}>
              <View style={styles.goalCardInner}>
                <View style={[styles.goalAccent, { backgroundColor: goalColor(g.kind) }]} />
                <View style={styles.goalBody}>
                  <Text style={styles.goalTitle}>{g.title}</Text>
                  <Text style={styles.goalSub}>
                    {labelKind(g.kind)}
                    {g.targetValue != null && ` · Ziel: ${g.targetValue}${g.unit ? ` ${g.unit}` : ''}`}
                    {g.deadline ? `  ·  ${g.deadline}` : ''}
                  </Text>
                </View>
                <Pressable onPress={() => removeGoal(g.id)} hitSlop={8} style={styles.deleteBtn}>
                  <FontAwesome name="trash" size={14} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          gAIn speichert alle Daten lokal auf deinem Gerät. Kein Account, kein Cloud-Sync.
        </Text>
      </View>
    </ScrollView>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <FontAwesome name={icon} size={14} color={colors.accent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function goalColor(kind: GoalKind): string {
  if (kind === 'lose_weight') return '#45B7D1';
  if (kind === 'gain_weight') return '#7ee787';
  return '#FBBF24';
}

function labelKind(k: GoalKind): string {
  return GOAL_KINDS.find((x) => x.id === k)?.label ?? k;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 48 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },

  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  helpText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginBottom: spacing.sm },
  link: { color: colors.accent, fontWeight: '600' },
  fieldLabel: { color: colors.muted, fontSize: 13, fontWeight: '500', marginBottom: 6, marginTop: 4 },

  // Provider selection
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    marginBottom: 8,
    gap: 10,
  },
  providerRowActive: { borderColor: colors.accent, backgroundColor: '#14532d22' },
  providerRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  providerRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  providerInfo: { flex: 1 },
  providerName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  providerNameActive: { color: colors.accent },
  providerDesc: { color: colors.muted, fontSize: 12, marginTop: 1 },
  freeBadge: {
    backgroundColor: '#14532d',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  freeBadgeText: { color: colors.accent, fontSize: 10, fontWeight: '800' },

  // API key
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    paddingRight: spacing.sm,
  },
  apiKeyInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: 'monospace',
  },
  eyeBtn: { padding: 8 },

  // Model picker
  modelPicker: { gap: 6, marginBottom: spacing.md },
  modelBtn: {
    padding: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  modelBtnActive: { borderColor: colors.accent, backgroundColor: '#14532d33' },
  modelBtnText: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  modelBtnTextActive: { color: colors.accent, fontWeight: '700' },

  // Goals
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { borderColor: colors.accent, backgroundColor: '#14532d33' },
  chipText: { color: colors.muted, fontSize: 13 },
  chipTextOn: { color: colors.accent },
  row: { flexDirection: 'row', gap: 8 },

  goalsList: { gap: 8, marginBottom: spacing.sm },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  goalCardInner: { flexDirection: 'row', alignItems: 'center' },
  goalAccent: { width: 4, alignSelf: 'stretch' },
  goalBody: { flex: 1, padding: spacing.md },
  goalTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  goalSub: { color: colors.muted, marginTop: 4, fontSize: 13, lineHeight: 18 },
  deleteBtn: { padding: spacing.md },

  footer: { marginTop: spacing.lg },
  footerText: { color: colors.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
