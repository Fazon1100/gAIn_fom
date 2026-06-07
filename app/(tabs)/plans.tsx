import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { xAlert } from '../../lib/presentation/alert';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, spacing } from '../../constants/theme';
import { useDb } from '../../context/DbProvider';
import {
  PLAN_SUGGESTIONS,
  generatePlan,
  type AiProvider,
  type GeneratedPlan,
} from '../../lib/application/ai';
import * as repo from '../../lib/data/repository';

export default function PlansScreen() {
  const { db, refreshToken } = useDb();
  const router = useRouter();
  const [templates, setTemplates] = useState<Awaited<
    ReturnType<typeof repo.listTemplates>
  >>([]);
  const [refreshing, setRefreshing] = useState(false);

  // AI plan generator state
  const [showGenerator, setShowGenerator] = useState(false);
  const [planPrompt, setPlanPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const load = useCallback(async () => {
    if (!db) return;
    setTemplates(await repo.listTemplates(db));
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

  const createNew = async () => {
    if (!db) return;
    const id = await repo.createTemplate(db, 'Neuer Plan');
    router.push(`/template/${id}`);
  };

  const remove = (id: number, name: string) => {
    xAlert('Plan löschen?', `"${name}" wirklich entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen',
        style: 'destructive',
        onPress: async () => {
          if (!db) return;
          await repo.deleteTemplate(db, id);
          load();
        },
      },
    ]);
  };

  const openGenerator = async () => {
    if (!db) return;
    const providerStr = await repo.getSetting(db, 'ai_provider');
    const prov = (providerStr || 'gemini') as AiProvider;
    const key = await repo.getSetting(db, `ai_key_${prov}`);
    if (!key) {
      xAlert(
        'KI nicht eingerichtet',
        'Bitte hinterlege zuerst einen API-Schlüssel im Profil-Tab unter "KI-Einstellungen".',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowGenerator(true);
  };

  const handleGenerate = async (prompt: string) => {
    if (!db || isGenerating) return;
    const text = prompt.trim();
    if (!text) return;

    const [providerStr, modelId] = await Promise.all([
      repo.getSetting(db, 'ai_provider'),
      repo.getSetting(db, 'ai_model'),
    ]);

    const provider = (providerStr || 'gemini') as AiProvider;
    const model = modelId || 'gemini-2.0-flash';
    const apiKey = await repo.getSetting(db, `ai_key_${provider}`);

    if (!apiKey) {
      xAlert('Fehler', 'API-Schlüssel fehlt. Bitte im Profil eintragen.');
      return;
    }

    setIsGenerating(true);
    try {
      const profile = await repo.getProfile(db);
      const plans = await generatePlan(provider, apiKey, model, text, profile);
      await savePlans(plans);
      setShowGenerator(false);
      setPlanPrompt('');
      await load();

      const count = plans.length;
      const names = plans.map((p) => p.name).join(', ');
      xAlert(
        'Plan erstellt!',
        `${count} ${count === 1 ? 'Plan wurde' : 'Pläne wurden'} erstellt: ${names}\n\nDu kannst sie jetzt anpassen und starten.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      xAlert('Fehler', msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const savePlans = async (plans: GeneratedPlan[]) => {
    if (!db) return;
    for (const plan of plans) {
      const templateId = await repo.createTemplate(db, plan.name);
      for (const ex of plan.exercises) {
        await repo.addTemplateExercise(db, templateId, ex.name, null, ex.sets, ex.reps);
      }
    }
  };

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <Text style={styles.lead}>
          Eigene Workouts: Übungen festlegen und vom Tab „Training" aus starten.
        </Text>

        {/* KI Plan Generator */}
        <Pressable
          style={({ pressed }) => [styles.aiBtn, pressed && { opacity: 0.8 }]}
          onPress={openGenerator}
        >
          <View style={styles.aiBtnIcon}>
            <FontAwesome name="magic" size={18} color={colors.accent} />
          </View>
          <View style={styles.aiBtnBody}>
            <Text style={styles.aiBtnTitle}>KI-Plan erstellen lassen</Text>
            <Text style={styles.aiBtnSub}>Die KI erstellt einen kompletten Trainingsplan für dich</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.accent} />
        </Pressable>

        <PrimaryButton title="Leeren Plan anlegen" onPress={createNew} variant="secondary" />

        <Text style={styles.section}>Deine Pläne</Text>
        {templates.length === 0 ? (
          <Text style={styles.muted}>Noch keine Pläne angelegt.</Text>
        ) : (
          templates.map((t) => (
            <View key={t.id} style={styles.row}>
              <Pressable
                style={styles.rowMain}
                onPress={() => router.push(`/template/${t.id}`)}
              >
                <Text style={styles.rowTitle}>{t.name}</Text>
                <Text style={styles.rowSub}>{formatDate(t.createdAt)}</Text>
              </Pressable>
              <Pressable
                onPress={() => remove(t.id, t.name)}
                hitSlop={12}
                accessibilityLabel="Plan löschen"
              >
                <FontAwesome name="trash" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* AI Plan Generator Modal */}
      <Modal visible={showGenerator} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>KI-Trainingsplan erstellen</Text>
            <Pressable onPress={() => { setShowGenerator(false); setPlanPrompt(''); }} hitSlop={12}>
              <FontAwesome name="times" size={20} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalLead}>
              Beschreibe, welchen Trainingsplan du brauchst. Die KI erstellt ihn mit Übungen aus dem Katalog.
            </Text>

            <Text style={styles.quickLabel}>Vorschläge</Text>
            <View style={styles.quickGrid}>
              {PLAN_SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.7 }]}
                  onPress={() => handleGenerate(s)}
                  disabled={isGenerating}
                >
                  <Text style={styles.quickChipText}>{s}</Text>
                  <FontAwesome name="arrow-right" size={11} color={colors.accent} />
                </Pressable>
              ))}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>oder eigene Beschreibung</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={styles.promptInput}
              value={planPrompt}
              onChangeText={setPlanPrompt}
              placeholder="z. B. 4-Tage Split mit Fokus auf Oberkörper, ich bin Anfänger…"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={500}
            />
            <PrimaryButton
              title={isGenerating ? 'Plan wird erstellt …' : 'Plan generieren'}
              onPress={() => handleGenerate(planPrompt)}
              disabled={isGenerating || !planPrompt.trim()}
            />

            {isGenerating && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.loadingText}>KI erstellt deinen Plan …</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso.replace(' ', 'T')).toLocaleDateString();
  } catch {
    return iso;
  }
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
  muted: { color: colors.muted },

  // AI Button
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14532d22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent + '44',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 12,
  },
  aiBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accent + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtnBody: { flex: 1 },
  aiBtnTitle: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  aiBtnSub: { color: colors.muted, fontSize: 12, marginTop: 2 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMain: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 4 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  modalContent: { padding: spacing.lg, paddingBottom: 48 },
  modalLead: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: spacing.lg },
  quickLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  quickGrid: { gap: 8 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  quickChipText: { color: colors.text, fontSize: 14, flex: 1, marginRight: 8 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.muted, fontSize: 12 },
  promptInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: spacing.lg,
  },
  loadingText: { color: colors.muted, fontSize: 14 },
});
