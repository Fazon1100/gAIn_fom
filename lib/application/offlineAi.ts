import {
  CATEGORY_LABELS,
  EXERCISES,
  type Exercise,
  type MuscleCategory,
} from './exercises';
import type { AiMessage, GeneratedPlan } from './ai';
import type { AnalyticsData } from './analysis';
import type { Profile } from '../data/types';

/**
 * Offline-„KI": liefert nützliche, regelbasierte Antworten ganz ohne API-Key
 * oder Internet. Gedacht für eine zuverlässige Live-Demo und als Fallback.
 * Bewusst kein echtes LLM – aber mit kuratiertem Fitness-/Ernährungswissen.
 */

type Knowledge = { keywords: string[]; answer: string };

const KNOWLEDGE: Knowledge[] = [
  {
    keywords: ['protein', 'eiweiß', 'eiweiss'],
    answer:
      'Für Muskelaufbau sind 1,6–2,2 g Protein pro kg Körpergewicht pro Tag ideal. Verteile es auf 3–4 Mahlzeiten à 30–40 g. Gute Quellen: Hähnchen, Eier, Magerquark, Fisch, Linsen und Whey. Mehr als ~2,2 g/kg bringt keinen zusätzlichen Vorteil.',
  },
  {
    keywords: ['kalorien', 'abnehmen', 'definieren', 'diät', 'diaet', 'defizit'],
    answer:
      'Zum Abnehmen brauchst du ein moderates Kaloriendefizit von ~300–500 kcal/Tag (≈ 0,5 kg/Woche). Halte das Protein hoch (2 g/kg), um Muskeln zu schützen, und trainiere weiter mit Gewichten. Zu aggressive Defizite kosten Kraft und Muskulatur.',
  },
  {
    keywords: ['masse', 'zunehmen', 'aufbauen', 'bulk', 'überschuss', 'ueberschuss'],
    answer:
      'Für sauberen Masseaufbau reicht ein Überschuss von ~200–400 kcal/Tag. Realistisch sind 0,25–0,5 kg/Monat für Fortgeschrittene. Mehr Tempo bedeutet meist mehr Fett. Kombiniere progressive Überlastung mit ausreichend Protein und Schlaf.',
  },
  {
    keywords: ['sätze', 'saetze', 'wiederholung', 'wdh', 'reps', 'rep'],
    answer:
      'Faustregeln: Kraft 3–5 Wdh, Hypertrophie (Muskelaufbau) 6–12 Wdh, Kraftausdauer 15+ Wdh. Für Muskelaufbau sind ~10–20 harte Sätze pro Muskelgruppe und Woche ein guter Richtwert. Lass 1–3 Wiederholungen „im Tank" (RIR 1–3).',
  },
  {
    keywords: ['regeneration', 'erholung', 'pause', 'ruhetag', 'übertraining', 'uebertraining'],
    answer:
      'Muskeln wachsen in der Erholung. Plane pro Muskelgruppe 48 h Pause, schlafe 7–9 h und gönn dir alle 4–8 Wochen eine leichtere Deload-Woche. Anhaltende Müdigkeit, Leistungsabfall und schlechter Schlaf sind Zeichen für zu wenig Erholung.',
  },
  {
    keywords: ['schlaf', 'schlafen'],
    answer:
      'Schlaf ist der stärkste Hebel für Regeneration und Muskelaufbau. Ziel: 7–9 h pro Nacht. Zu wenig Schlaf senkt Kraft, Testosteron und Proteinsynthese und steigert den Hunger. Feste Zeiten und ein dunkler, kühler Raum helfen.',
  },
  {
    keywords: ['supplement', 'kreatin', 'creatine', 'nahrungsergänzung', 'booster'],
    answer:
      'Evidenzbasiert wirklich sinnvoll: Kreatin Monohydrat (3–5 g/Tag, jeden Tag), Whey-Protein (Bequemlichkeit), Vitamin D und ggf. Omega-3 und Koffein vor dem Training. Der Rest ist meist überflüssig. Kreatin ist das mit Abstand beste Preis-Leistungs-Supplement.',
  },
  {
    keywords: ['aufwärmen', 'aufwaermen', 'warm up', 'warmup', 'mobilisieren'],
    answer:
      'Wärm dich 5–10 min allgemein auf (Cardio + Mobilität) und mache dann 2–3 Aufwärmsätze mit steigendem Gewicht vor der ersten schweren Übung. Das schützt Gelenke, verbessert die Technik und steigert die Leistung im Arbeitssatz.',
  },
  {
    keywords: ['plateau', 'stagnation', 'kein fortschritt', 'stillstand'],
    answer:
      'Plateaus durchbrichst du durch: progressive Überlastung (mehr Gewicht/Wdh/Sätze über Wochen), Technik-Check, genug Protein & Schlaf, und ggf. eine Deload-Woche. Variiere Übungen oder Wiederholungsbereiche, wenn sich über 3–4 Wochen nichts bewegt.',
  },
  {
    keywords: ['muskelkater', 'doms', 'wund'],
    answer:
      'Muskelkater (DOMS) ist normal, vor allem bei neuen Reizen, und kein Muss für Fortschritt. Leichte Bewegung, Schlaf, Protein und Hydration helfen. Trainiere die Muskelgruppe erst wieder, wenn der starke Kater abgeklungen ist.',
  },
  {
    keywords: ['kniebeuge', 'squat', 'beine trainieren'],
    answer:
      'Kniebeuge-Tipps: Stange auf dem oberen Rücken, Stand etwas breiter als schulterbreit, Zehen leicht nach außen. Tief einatmen und Bauch anspannen, Knie in Zehenrichtung nach außen drücken, mindestens bis Oberschenkel parallel. Brust hoch, Fersen am Boden.',
  },
  {
    keywords: ['bankdrücken', 'bankdruecken', 'bench', 'brust trainieren'],
    answer:
      'Bankdrücken-Tipps: Schulterblätter zusammen und nach unten, leichtes Hohlkreuz, Füße fest am Boden. Stange zur unteren Brust führen, Ellbogen ~45–75°, kontrolliert ablassen und kraftvoll drücken. Handgelenke gerade über den Ellbogen.',
  },
  {
    keywords: ['kreuzheben', 'deadlift'],
    answer:
      'Kreuzheben-Tipps: Stange über Mittelfuß, Schienbein nah an die Stange. Hüfte hoch, Rücken gerade (neutral), Lats anspannen. Mit „Beindruck" vom Boden lösen, Stange nah am Körper führen, Hüfte und Knie gleichzeitig strecken. Kein Rundrücken.',
  },
  {
    keywords: ['cardio', 'ausdauer', 'laufen', 'fett verbrennen', 'hiit'],
    answer:
      'Cardio unterstützt Herzgesundheit und Kaloriendefizit. 2–3 Einheiten/Woche reichen meist: lockeres Ausdauertraining (Zone 2, 20–40 min) oder 1× HIIT. Plane Cardio so, dass es deine Kraft-Regeneration nicht stört – am besten nach dem Krafttraining oder an Ruhetagen.',
  },
  {
    keywords: ['wie oft', 'häufigkeit', 'haeufigkeit', 'frequenz', 'pro woche', 'split'],
    answer:
      'Für die meisten sind 3–5 Trainingstage/Woche optimal. Beliebte Splits: Ganzkörper (3×/Woche, ideal für Einsteiger), Oberkörper/Unterkörper (4×) oder Push/Pull/Legs (3–6×). Wichtiger als der Split: jede Muskelgruppe ~2× pro Woche treffen.',
  },
  {
    keywords: ['wasser', 'trinken', 'hydration', 'flüssigkeit', 'fluessigkeit'],
    answer:
      'Trinke rund 30–40 ml Wasser pro kg Körpergewicht und Tag, beim Training etwas mehr. Schon 2 % Flüssigkeitsverlust senken die Leistung. Heller Urin ist ein gutes Zeichen für ausreichende Hydration.',
  },
];

function profileContext(profile: Profile | null): string {
  if (!profile) return '';
  const bits: string[] = [];
  if (profile.goalTitle) bits.push(`dein Ziel „${profile.goalTitle}"`);
  if (profile.goalTargetWeight != null) bits.push(`Zielgewicht ${profile.goalTargetWeight} kg`);
  if (bits.length === 0) return '';
  return ` Bezogen auf ${bits.join(' und ')}: bleib konsequent und steigere dich Woche für Woche.`;
}

/** Beantwortet eine Chat-Nachricht regelbasiert anhand der Wissensbasis. */
export function offlineChat(history: AiMessage[], profile: Profile | null): string {
  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  const text = (lastUser?.content ?? '').toLowerCase();

  // Beste Übereinstimmung anhand der Anzahl getroffener Keywords
  let best: Knowledge | null = null;
  let bestScore = 0;
  for (const k of KNOWLEDGE) {
    const score = k.keywords.reduce((s, kw) => (text.includes(kw) ? s + 1 : s), 0);
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }

  if (best && bestScore > 0) {
    return best.answer + profileContext(profile);
  }

  // Übungs-spezifische Frage? Versuche Treffer im Katalog.
  const ex = EXERCISES.find((e) => text.includes(e.name.toLowerCase()) || text.includes(e.nameEn.toLowerCase()));
  if (ex) {
    return (
      `${ex.name} (${ex.nameEn}): ${ex.description}\n\nAusführung:\n` +
      ex.instructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n') +
      (ex.tips.length ? `\n\nTipp: ${ex.tips[0]}` : '')
    );
  }

  return (
    'Ich bin dein gAIn Offline-Coach und helfe dir bei Training, Ernährung und Regeneration. ' +
    'Frag mich z. B. nach Protein, Sätzen & Wiederholungen, einem passenden Split, Regeneration, ' +
    'Supplements oder der Technik einer Übung (z. B. „Wie geht Kreuzheben?").' +
    profileContext(profile)
  );
}

// ── Offline-Trainingsplan-Generator ─────────────────────────────────────────────

type Level = 'anfaenger' | 'fortgeschritten' | 'profi';

function detectLevel(text: string): Level {
  if (/(anfänger|anfaenger|beginner|neu|einsteiger)/.test(text)) return 'anfaenger';
  if (/(profi|experte|advanced|erfahren)/.test(text)) return 'profi';
  return 'fortgeschritten';
}

function setsRepsFor(level: Level): { sets: number; reps: string } {
  if (level === 'anfaenger') return { sets: 3, reps: '10-12' };
  if (level === 'profi') return { sets: 4, reps: '6-10' };
  return { sets: 4, reps: '8-12' };
}

function pickByCategory(cat: MuscleCategory, count: number): Exercise[] {
  return EXERCISES.filter((e) => e.category === cat).slice(0, count);
}

function buildDay(name: string, cats: [MuscleCategory, number][], level: Level): GeneratedPlan {
  const { sets, reps } = setsRepsFor(level);
  const exercises: { name: string; sets: number; reps: string }[] = [];
  for (const [cat, count] of cats) {
    for (const ex of pickByCategory(cat, count)) {
      exercises.push({ name: ex.name, sets, reps: ex.category === 'core' || ex.category === 'cardio' ? '12-15' : reps });
    }
  }
  return { name, exercises };
}

/** Erstellt regelbasiert einen Trainingsplan aus dem Übungskatalog. */
export function offlinePlan(userRequest: string, _profile: Profile | null): GeneratedPlan[] {
  const text = userRequest.toLowerCase();
  const level = detectLevel(text);

  const isPPL = /(push.?pull|ppl|push\/pull)/.test(text) || (text.includes('push') && text.includes('pull'));
  const isUpperLower = (/(upper|ober)/.test(text) && /(lower|unter)/.test(text));
  const isFull = /(full|ganzkörper|ganzkoerper|ganzkörper|fullbody)/.test(text);

  if (isPPL) {
    return [
      buildDay('Push (Brust, Schultern, Trizeps)', [['brust', 2], ['schultern', 2], ['trizeps', 2]], level),
      buildDay('Pull (Rücken, Bizeps)', [['ruecken', 3], ['bizeps', 2]], level),
      buildDay('Legs (Beine, Core)', [['beine', 3], ['core', 2]], level),
    ];
  }
  if (isUpperLower) {
    return [
      buildDay('Oberkörper', [['brust', 2], ['ruecken', 2], ['schultern', 1], ['bizeps', 1], ['trizeps', 1]], level),
      buildDay('Unterkörper', [['beine', 4], ['core', 2]], level),
    ];
  }

  // Spezifische Muskelgruppe erwähnt?
  const single: [MuscleCategory, number][] = [];
  if (/(brust|chest)/.test(text)) single.push(['brust', 3]);
  if (/(rücken|ruecken|back)/.test(text)) single.push(['ruecken', 3]);
  if (/(bein|legs|squat)/.test(text)) single.push(['beine', 3]);
  if (/(schulter|shoulder)/.test(text)) single.push(['schultern', 3]);
  if (/(arm|bizeps|trizeps)/.test(text)) single.push(['bizeps', 2], ['trizeps', 2]);
  if (/(bauch|core|abs)/.test(text)) single.push(['core', 3]);
  if (!isFull && single.length > 0) {
    return [buildDay('Dein Fokus-Training', single, level)];
  }

  // Standard: Ganzkörper
  return [
    buildDay('Ganzkörper-Training', [['beine', 1], ['brust', 1], ['ruecken', 1], ['schultern', 1], ['bizeps', 1], ['trizeps', 1], ['core', 1]], level),
  ];
}

// ── Offline-Fortschrittsanalyse ─────────────────────────────────────────────────

function trendDirection(values: number[]): 'steigend' | 'fallend' | 'stabil' {
  if (values.length < 2) return 'stabil';
  const first = values[0];
  const last = values[values.length - 1];
  if (last > first * 1.05) return 'steigend';
  if (last < first * 0.95) return 'fallend';
  return 'stabil';
}

const ALL_CATS: MuscleCategory[] = [
  'brust', 'ruecken', 'schultern', 'bizeps', 'trizeps', 'beine', 'core', 'cardio',
];

/** Erstellt die 4-Abschnitts-Analyse rein lokal aus den Kennzahlen. */
export function offlineAnalysis(data: AnalyticsData, profile: Profile | null): string {
  if (data.totalSessions === 0) {
    return 'Noch keine abgeschlossenen Trainings. Speichere deine erste Einheit, dann liefere ich dir hier eine vollständige Auswertung.';
  }

  const good: string[] = [];
  const watch: string[] = [];
  const steps: string[] = [];

  // Häufigkeit
  if (data.streakWeeks >= 2) good.push(`Konstanz: ${data.streakWeeks} Wochen in Folge trainiert. 🔥`);
  if (data.avgSessionsPerWeek >= 3) good.push(`Solide Frequenz mit ⌀ ${data.avgSessionsPerWeek} Einheiten/Woche.`);
  else watch.push(`Frequenz mit ⌀ ${data.avgSessionsPerWeek} Einheiten/Woche ist eher niedrig – 3×/Woche bringt deutlich mehr Fortschritt.`);

  // Volumen-Trend
  const volTrend = trendDirection(data.weeks.map((w) => w.volumeKg));
  if (volTrend === 'steigend') good.push('Dein Wochenvolumen steigt – saubere progressive Überlastung.');
  else if (volTrend === 'fallend') watch.push('Dein Wochenvolumen ist zuletzt gefallen – prüfe Erholung, Schlaf und Intensität.');

  // Muskelverteilung
  if (data.muscleGroups.length > 0) {
    const top = data.muscleGroups[0];
    good.push(`Schwerpunkt liegt auf ${top.label} (${top.pct}% des Volumens).`);
    const trained = new Set(data.muscleGroups.map((m) => m.category));
    const neglected = ALL_CATS.filter((c) => c !== 'cardio' && !trained.has(c)).map((c) => CATEGORY_LABELS[c]);
    if (neglected.length > 0) {
      watch.push(`Vernachlässigt: ${neglected.slice(0, 4).join(', ')}. Für eine ausgewogene Entwicklung einbauen.`);
    }
  }

  // Kraftverlauf der Top-Übung
  const trend = data.exerciseTrends.find((t) => t.points.length >= 2);
  if (trend) {
    const weights = trend.points.map((p) => p.maxWeight);
    const dir = trendDirection(weights);
    const first = weights[0];
    const last = weights[weights.length - 1];
    if (dir === 'steigend') good.push(`${trend.name}: von ${first} kg auf ${last} kg gesteigert. Top!`);
    else if (dir === 'fallend') watch.push(`${trend.name}: zuletzt von ${first} kg auf ${last} kg gefallen – evtl. Deload oder Technik prüfen.`);
    else steps.push(`${trend.name} stagniert bei ~${last} kg – versuche +2,5 kg oder eine Wiederholung mehr pro Satz.`);
  }

  // Empfehlungen zum Ziel
  if (profile?.goalTitle || profile?.goalTargetWeight != null) {
    const goal = profile.goalTitle ?? `Zielgewicht ${profile.goalTargetWeight} kg`;
    steps.push(`Richte das Training konsequent auf dein Ziel „${goal}" aus.`);
  }
  steps.push('Steigere wöchentlich kleine Schritte (Gewicht oder Wiederholungen) und protokolliere jeden Satz.');
  if (data.avgSessionsPerWeek < 3) steps.push('Plane eine feste zusätzliche Einheit pro Woche ein.');

  if (good.length === 0) good.push('Du hast den ersten Schritt gemacht – dranbleiben zahlt sich aus.');
  if (watch.length === 0) watch.push('Aktuell keine größeren Schwachstellen erkennbar – weiter so.');

  const fmt = (arr: string[]) => arr.map((s) => `• ${s}`).join('\n');

  return (
    `📊 Zusammenfassung\n` +
    `${data.totalSessions} Einheiten, ⌀ ${data.avgSessionsPerWeek}/Woche, Gesamtvolumen ${data.totalVolumeKg.toLocaleString('de-DE')} kg·Wdh. Aktuelle Serie: ${data.streakWeeks} Woche(n).\n\n` +
    `✅ Das läuft gut\n${fmt(good)}\n\n` +
    `⚠️ Darauf solltest du achten\n${fmt(watch)}\n\n` +
    `🎯 Nächste Schritte\n${fmt(steps)}\n\n` +
    `(Offline-Analyse – für eine noch ausführlichere Auswertung im Profil einen KI-Anbieter mit Schlüssel wählen.)`
  );
}
