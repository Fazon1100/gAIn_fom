import { EXERCISES } from './exercises';
import type { AnalyticsData } from './analysis';
import { formatAnalyticsForAi } from './analysis';
import { GROQ_KEY } from './secret';
import type { Profile } from '../data/types';

// ── Provider & Model types ────────────────────────────────────────────────────

export type AiProvider = 'groq' | 'gemini' | 'anthropic';

/**
 * Vorkonfigurierter Groq-API-Schlüssel, damit jeder Nutzer die KI sofort ohne
 * eigene Einrichtung nutzen kann. Der Schlüssel ist obfuskiert hinterlegt
 * (siehe ./secret) und steht nicht im Klartext im Code.
 */
export const GROQ_API_KEY = GROQ_KEY;

/** Standard-Anbieter & -Modell (Groq, sofort einsatzbereit). */
export const DEFAULT_PROVIDER: AiProvider = 'groq';
export const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/** Eingebauter Schlüssel je Anbieter (nur Groq ist vorkonfiguriert). */
export function builtInKey(provider: AiProvider): string {
  return provider === 'groq' ? GROQ_API_KEY : '';
}

/** Liefert den effektiven Schlüssel: selbst hinterlegt oder eingebaut. */
export function effectiveKey(provider: AiProvider, storedKey: string | null | undefined): string {
  const stored = (storedKey ?? '').trim();
  return stored || builtInKey(provider);
}

/** Wandelt einen gespeicherten Anbieter-Wert sicher um (Fallback: Standard). */
export function normalizeProvider(value: string | null | undefined): AiProvider {
  return value === 'groq' || value === 'gemini' || value === 'anthropic'
    ? value
    : DEFAULT_PROVIDER;
}

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  groq: '⚡ Groq (LLaMA) – Standard',
  gemini: '🆓 Google Gemini',
  anthropic: '💳 Anthropic (Claude)',
};

export const PROVIDER_DESCRIPTIONS: Record<AiProvider, string> = {
  groq: 'Vorkonfiguriert · sofort startklar · sehr schnell',
  gemini: 'Kostenlos · 1.500 Anfragen/Tag · aistudio.google.com',
  anthropic: 'Kostenpflichtig · ~€0,001/Nachricht · console.anthropic.com',
};

export const PROVIDER_KEY_PLACEHOLDER: Record<AiProvider, string> = {
  groq: 'gsk_…',
  gemini: 'AIza…',
  anthropic: 'sk-ant-…',
};

export const PROVIDER_MODELS: Record<AiProvider, { id: string; label: string }[]> = {
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'LLaMA 3.3 70B (klug)' },
    { id: 'llama-3.1-8b-instant', label: 'LLaMA 3.1 8B (schnellster)' },
  ],
  gemini: [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (empfohlen)' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  anthropic: [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku (sparsam)' },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet (klüger)' },
  ],
};

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── System Prompt ─────────────────────────────────────────────────────────────

/** Baut eine kompakte Beschreibung des einzelnen Nutzerziels für die Prompts. */
function goalBlock(profile: Profile | null): string {
  if (!profile) return 'Ziel: nicht angegeben';
  const parts: string[] = [];
  if (profile.goalTitle) parts.push(profile.goalTitle);
  if (profile.goalTargetWeight != null) parts.push(`Zielgewicht: ${profile.goalTargetWeight} kg`);
  if (profile.goalNote) parts.push(profile.goalNote);
  return parts.length > 0 ? `Ziel: ${parts.join(' · ')}` : 'Ziel: nicht angegeben';
}

function buildSystemPrompt(profile: Profile | null): string {
  const name = profile?.displayName || 'Athlet';
  const height = profile?.heightCm ? `${profile.heightCm} cm` : 'nicht angegeben';
  const weight = profile?.weightKg ? `${profile.weightKg} kg` : 'nicht angegeben';
  const notes = profile?.notes || 'keine';

  return `Du bist gAIn AI, ein professioneller KI-Fitness- und Ernährungscoach.

Du hast umfassendes Wissen über:

TRAINING:
- Krafttraining: Progressive Überlastung, Periodisierung, Trainingssplits (Push/Pull/Legs, PPL, Upper/Lower, Full-Body)
- Übungstechnik und korrekte Ausführung für alle gängigen Kraftübungen
- Trainingsplanung: Satzanzahl, Wiederholungsbereiche (Kraft: 1-5, Hypertrophie: 6-12, Ausdauer: 15+), Frequenz
- Hypertrophie: ~10-20 Sätze/Muskelgruppe/Woche; MEV, MAV, MRV-Konzepte
- Regeneration: 7-9h Schlaf, aktive Erholung, Deload-Wochen (alle 4-8 Wochen)
- Verletzungsprävention: Aufwärmen, korrekte Technik, angemessene Belastungssteigerung

ERNÄHRUNG:
- Protein: 1,6-2,2g/kg Körpergewicht für Muskelaufbau; Quellen: Fleisch, Fisch, Eier, Hülsenfrüchte, Whey
- Kalorienbilanz: Überschuss ~200-500 kcal für Aufbau, Defizit ~300-500 kcal zum Abnehmen
- Mahlzeiten-Timing: Protein vor/nach Training wichtiger als exaktes Timing
- Supplements (evidenzbasiert): Kreatin (3-5g/Tag), Whey Protein, Vitamin D, Zink, Omega-3, Koffein
- Hydration: ~35ml/kg/Tag als Basis, mehr beim Training

KÖRPERZUSAMMENSETZUNG:
- Muskelaufbau: Realistisch 0,5-1 kg/Monat für Anfänger, 0,25-0,5 für Fortgeschrittene
- Fettabbau: 0,5-1 kg/Woche als nachhaltiges Tempo
- Body-Rekomposition: Möglich für Anfänger und nach Trainingspause

NUTZERPROFIL:
- Name: ${name}
- Größe: ${height}
- Gewicht: ${weight}
- Notizen: ${notes}
- ${goalBlock(profile)}

KOMMUNIKATION:
- Antworte IMMER in der Sprache, in der der Nutzer schreibt (Deutsch oder Englisch)
- Sei konkret und direkt – keine generischen Floskeln
- Halte Antworten unter 350 Wörtern, es sei denn mehr Detail ist notwendig
- Sei motivierend aber realistisch
- Bei Verletzungen oder medizinischen Problemen: auf Arzt/Physiotherapeut hinweisen
- Nutze Zahlen und konkrete Empfehlungen wo möglich`;
}

// ── Provider implementations ──────────────────────────────────────────────────

async function sendGemini(
  apiKey: string,
  modelId: string,
  history: AiMessage[],
  systemPrompt: string
): Promise<string> {
  // Gemini uses "model" role instead of "assistant"
  const contents = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 400 && body.includes('API_KEY')) {
      throw new Error('Gemini API-Key ungültig. Bitte prüfe deinen Key in den KI-Einstellungen.');
    }
    if (response.status === 429) {
      throw new Error('Tages-Limit erreicht. Morgen wieder verfügbar oder anderen Anbieter wählen.');
    }
    throw new Error(`Gemini Fehler ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Keine Antwort von Gemini erhalten.');
  return text;
}

async function sendGroq(
  apiKey: string,
  modelId: string,
  history: AiMessage[],
  systemPrompt: string
): Promise<string> {
  // Groq is OpenAI-compatible
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401) {
      throw new Error('Groq API-Key ungültig. Bitte prüfe deinen Key in den KI-Einstellungen.');
    }
    if (response.status === 429) {
      throw new Error('Groq Rate-Limit erreicht. Bitte kurz warten.');
    }
    throw new Error(`Groq Fehler ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Keine Antwort von Groq erhalten.');
  return text;
}

async function sendAnthropic(
  apiKey: string,
  modelId: string,
  history: AiMessage[],
  systemPrompt: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 1024,
      system: systemPrompt,
      messages: history,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401) {
      throw new Error('Anthropic API-Key ungültig. Bitte prüfe deinen Key in den KI-Einstellungen.');
    }
    if (response.status === 429) {
      throw new Error('Zu viele Anfragen. Bitte kurz warten.');
    }
    throw new Error(`Anthropic Fehler ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };
  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('Keine Antwort von Claude erhalten.');
  return textBlock.text;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendMessage(
  provider: AiProvider,
  apiKey: string,
  modelId: string,
  history: AiMessage[],
  profile: Profile | null
): Promise<string> {
  const systemPrompt = buildSystemPrompt(profile);
  switch (provider) {
    case 'gemini':
      return sendGemini(apiKey, modelId, history, systemPrompt);
    case 'groq':
      return sendGroq(apiKey, modelId, history, systemPrompt);
    case 'anthropic':
      return sendAnthropic(apiKey, modelId, history, systemPrompt);
  }
}

// ── AI Plan Generator ─────────────────────────────────────────────────────────

export interface GeneratedPlanExercise {
  name: string;
  sets: number;
  reps: string;
}

export interface GeneratedPlan {
  name: string;
  exercises: GeneratedPlanExercise[];
}

function buildPlanPrompt(profile: Profile | null): string {
  const exerciseNames = EXERCISES.map((e) => e.name).join(', ');
  const weight = profile?.weightKg ? `${profile.weightKg} kg` : 'nicht bekannt';
  const notes = profile?.notes || 'keine';

  return `Du bist ein professioneller Fitness-Trainer. Du erstellst strukturierte Trainingspläne.

VERFÜGBARE ÜBUNGEN (nutze NUR diese Namen exakt wie angegeben):
${exerciseNames}

NUTZERPROFIL:
- Gewicht: ${weight}
- Notizen: ${notes}
- ${goalBlock(profile)}

REGELN:
- Antworte AUSSCHLIESSLICH mit validem JSON, kein anderer Text
- Erstelle einen oder mehrere Tages-Pläne je nach Anfrage
- Verwende NUR Übungsnamen aus der obigen Liste (exakte Schreibweise!)
- Pro Plan 4-8 Übungen in sinnvoller Reihenfolge (große Muskelgruppen zuerst)
- Benenne die Pläne passend auf Deutsch (z.B. "Push Tag", "Beine & Core")
- Gib für JEDE Übung die empfohlene Satzanzahl und Wiederholungen an
- Passe Sätze und Wiederholungen an das Niveau des Nutzers an:
  - Anfänger: 2-3 Sätze, moderate Wiederholungen (8-12)
  - Fortgeschritten: 3-4 Sätze, variierte Wiederholungen (6-12)
  - Profi/Experte: 4-5 Sätze, periodisierte Wiederholungen (3-15)
- Wenn der Nutzer kein Niveau angibt, wähle "Fortgeschritten" als Standard
- Das "reps"-Feld kann Bereiche enthalten (z.B. "8-12") oder feste Zahlen (z.B. "10")
- Für zeitbasierte Übungen (z.B. Plank) verwende Sekunden (z.B. "30-60s")

ANTWORTFORMAT (JSON-Array):
[
  {
    "name": "Planname",
    "exercises": [
      { "name": "Übungsname", "sets": 3, "reps": "8-12" },
      { "name": "Übungsname", "sets": 4, "reps": "10" }
    ]
  }
]

Bei einem einzelnen Tag gib ein Array mit einem Element zurück.
Bei PPL, Upper/Lower etc. gib mehrere Pläne zurück.`;
}

export async function generatePlan(
  provider: AiProvider,
  apiKey: string,
  modelId: string,
  userRequest: string,
  profile: Profile | null
): Promise<GeneratedPlan[]> {
  const systemPrompt = buildPlanPrompt(profile);
  const history: AiMessage[] = [{ role: 'user', content: userRequest }];

  let text: string;
  switch (provider) {
    case 'gemini':
      text = await sendGemini(apiKey, modelId, history, systemPrompt);
      break;
    case 'groq':
      text = await sendGroq(apiKey, modelId, history, systemPrompt);
      break;
    case 'anthropic':
      text = await sendAnthropic(apiKey, modelId, history, systemPrompt);
      break;
  }

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Die KI konnte keinen Plan im richtigen Format erstellen. Bitte versuche es erneut.');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    name: string;
    exercises: Array<string | { name: string; sets?: number; reps?: string }>;
  }>;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Leerer Plan erhalten. Bitte beschreibe genauer, was du trainieren möchtest.');
  }

  return parsed.map((p) => ({
    name: String(p.name),
    exercises: Array.isArray(p.exercises)
      ? p.exercises.map((e) => {
          if (typeof e === 'string') return { name: e, sets: 3, reps: '8-12' };
          return {
            name: String(e.name),
            sets: typeof e.sets === 'number' ? e.sets : 3,
            reps: e.reps ? String(e.reps) : '8-12',
          };
        })
      : [],
  }));
}

// ── KI-Fortschrittsanalyse (Reporting) ─────────────────────────────────────────

function buildAnalysisSystemPrompt(profile: Profile | null): string {
  const name = profile?.displayName || 'Athlet';
  const weight = profile?.weightKg ? `${profile.weightKg} kg` : 'nicht angegeben';

  return `Du bist gAIn AI, ein datengetriebener Kraft- und Fitness-Analyst.
Du bekommst die echten Trainingsdaten eines Nutzers und erstellst eine kurze, motivierende Auswertung.

NUTZER:
- Name: ${name}
- Gewicht: ${weight}
- ${goalBlock(profile)}

DEINE AUFGABE:
Analysiere die Daten und antworte mit GENAU diesen vier Abschnitten (jeweils mit Emoji-Überschrift):

📊 Zusammenfassung
(2-3 Sätze: Trainingshäufigkeit, Volumen-Trend, Gesamtbild)

✅ Das läuft gut
(2-3 konkrete Stichpunkte mit Zahlen aus den Daten)

⚠️ Darauf solltest du achten
(2-3 konkrete Stichpunkte: Schwachstellen, Ungleichgewichte, Plateaus, vernachlässigte Muskelgruppen)

🎯 Nächste Schritte
(2-3 konkrete, umsetzbare Empfehlungen – passend zum Ziel des Nutzers)

REGELN:
- Beziehe dich auf konkrete Zahlen und Übungsnamen aus den Daten
- Bei Plateaus/Rückgängen bei einer Übung: benenne sie konkret
- Verbinde die Empfehlungen mit dem Ziel des Nutzers
- Schreibe auf Deutsch, motivierend aber ehrlich
- Halte dich KURZ (max. 250 Wörter), nutze Stichpunkte
- Keine erfundenen Daten – nur was in den Daten steht`;
}

/**
 * Erstellt eine KI-Auswertung aus den aufbereiteten Trainingsdaten.
 * Im Offline-Modus rein lokal, sonst über den gewählten KI-Anbieter.
 */
export async function generateAnalysis(
  provider: AiProvider,
  apiKey: string,
  modelId: string,
  data: AnalyticsData,
  profile: Profile | null
): Promise<string> {
  const systemPrompt = buildAnalysisSystemPrompt(profile);
  const history: AiMessage[] = [
    {
      role: 'user',
      content: `Hier sind meine Trainingsdaten. Bitte analysiere sie:\n\n${formatAnalyticsForAi(
        data,
        profile
      )}`,
    },
  ];
  switch (provider) {
    case 'gemini':
      return sendGemini(apiKey, modelId, history, systemPrompt);
    case 'groq':
      return sendGroq(apiKey, modelId, history, systemPrompt);
    case 'anthropic':
      return sendAnthropic(apiKey, modelId, history, systemPrompt);
  }
}

// ── Sprache → Text (Groq Whisper) ───────────────────────────────────────────────

/**
 * Transkribiert eine Audioaufnahme über Groqs Whisper-Endpoint (deutsch).
 * Nutzt den vorkonfigurierten Groq-Zugang.
 */
export async function transcribeAudio(uri: string): Promise<string> {
  const form = new FormData();
  // React-Native-FormData-Datei (uri/name/type)
  form.append('file', { uri, name: 'speech.m4a', type: 'audio/m4a' } as unknown as Blob);
  form.append('model', 'whisper-large-v3-turbo');
  form.append('language', 'de');
  form.append('response_format', 'json');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401) {
      throw new Error('Groq-Zugang ungültig für die Transkription.');
    }
    throw new Error(`Transkription fehlgeschlagen (${response.status}): ${body.slice(0, 150)}`);
  }

  const data = (await response.json()) as { text?: string };
  return (data.text ?? '').trim();
}

export const PLAN_SUGGESTIONS = [
  'Push/Pull/Legs Split (3 Tage)',
  'Oberkörper/Unterkörper Split (2 Tage)',
  'Full Body Anfänger (1 Tag)',
  'Brust & Trizeps Tag',
  'Rücken & Bizeps Tag',
  'Beine & Core Tag',
  'Schnelles 30-Minuten Ganzkörper-Workout',
];

export const QUICK_PROMPTS = [
  'Erstell mir einen Trainingsplan für diese Woche',
  'Wie viel Protein brauche ich täglich?',
  'Was sind die besten Übungen für Muskelaufbau?',
  'Tipps für bessere Regeneration',
  'Wie verbessere ich meine Kniebeugen-Technik?',
  'Was soll ich vor dem Training essen?',
  'Wie erkenne ich ein Training-Plateau?',
  'Welche Supplements sind wirklich sinnvoll?',
];
