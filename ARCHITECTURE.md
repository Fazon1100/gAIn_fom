# gAIn – Architektur

Die App ist bewusst in **drei logische Schichten** getrennt (Schichtenarchitektur /
*layered architecture*). Jede Schicht kennt nur die Schicht **unter** sich – die
Datenschicht weiß nichts von der UI, die UI greift nie direkt auf SQL zu.

```
┌─────────────────────────────────────────────────────────────┐
│  PRÄSENTATIONSSCHICHT (Frontend)                             │
│  app/            – Screens & Routing (expo-router)          │
│  components/      – wiederverwendbare UI-Bausteine          │
│  context/         – React-Provider (DB-Kontext)            │
│  constants/       – Theme (Farben, Abstände)               │
│  lib/presentation – plattformübergreifende UI-Helfer       │
└───────────────────────────────┬─────────────────────────────┘
                                │  ruft Funktionen auf
┌───────────────────────────────▼─────────────────────────────┐
│  ANWENDUNGSSCHICHT (Backend / Business-Logik)               │
│  lib/application/ai.ts        – KI-Anbindung (Coach, Plan,  │
│                                 Fortschritts-Analyse)       │
│  lib/application/analysis.ts  – Reporting: Kennzahlen,      │
│                                 Trends, Aufbereitung für KI │
│  lib/application/exercises.ts – Übungskatalog (Domänenwissen)│
└───────────────────────────────┬─────────────────────────────┘
                                │  liest / schreibt Daten
┌───────────────────────────────▼─────────────────────────────┐
│  DATENSCHICHT (Datenbank)                                   │
│  lib/data/db.ts          – Schema, Migrationen (SQLite)    │
│  lib/data/repository.ts  – Datenzugriff (CRUD, Queries)    │
│  lib/data/types.ts       – Datenmodelle / Entitäten        │
└─────────────────────────────────────────────────────────────┘
```

## 1. Präsentationsschicht (Frontend)

Verantwortlich für **Darstellung und Interaktion**. Enthält keine Geschäftslogik
und keine SQL-Abfragen – sie ruft ausschließlich Funktionen der Anwendungsschicht
bzw. des Repositories auf.

| Ordner / Datei | Aufgabe |
| --- | --- |
| `app/(tabs)/` | Haupt-Tabs: Training, Übungen, KI Coach, Fortschritt, Pläne, Profil |
| `app/session`, `app/template`, `app/exercise` | Detailseiten |
| `components/` | `BarChart`, `Field`, `PrimaryButton`, `ExercisePickerModal` |
| `context/DbProvider.tsx` | Stellt die geöffnete DB per React-Context bereit |
| `constants/theme.ts` | Farben & Abstände |
| `lib/presentation/alert.ts` | Plattformübergreifende Dialoge (Web + Mobile) |

## 2. Anwendungsschicht (Backend / Business-Logik)

Das „Gehirn" der App. Hier liegen die **Anwendungsfälle**: Kommunikation mit der
KI und die Aufbereitung der Reporting-Daten.

- **`ai.ts`** – kapselt drei KI-Anbieter (Google Gemini, Groq, Anthropic) hinter
  einer einheitlichen Schnittstelle. Funktionen:
  - `sendMessage()` – Chat mit dem KI-Coach
  - `generatePlan()` – erzeugt strukturierte Trainingspläne (JSON)
  - `generateAnalysis()` – erstellt die textliche Fortschrittsanalyse
- **`analysis.ts`** – sammelt über das Repository alle Trainingsdaten,
  berechnet Kennzahlen (Frequenz, Volumen-Trend, Serie, Muskelverteilung,
  Kraftverlauf je Übung) und formatiert sie als Eingabe für die KI.
- **`exercises.ts`** – statischer Übungskatalog (Domänenwissen): 38 Übungen mit
  Beschreibung, Ausführung, Tipps und Alternativen.

## 3. Datenschicht (Datenbank)

Lokale Persistenz mit **SQLite** (`expo-sqlite`). Kein Server, keine Cloud –
alle Daten bleiben auf dem Gerät.

- **`db.ts`** – legt das Schema an und führt Migrationen aus (z. B. neue Spalten).
- **`repository.ts`** – einzige Stelle mit SQL. Bündelt alle Lese-/Schreib-
  Operationen sowie die Analytics-Abfragen (`trainingSummary`,
  `weekdayDistribution`, `exerciseVolumeTotals`, `exerciseProgress`, …).
- **`types.ts`** – TypeScript-Typen der gespeicherten Entitäten
  (`Profile`, `WorkoutTemplate`, `SessionRow`, `SetRow`, …).

### Tabellen (Auszug)

| Tabelle | Inhalt |
| --- | --- |
| `profile` | Nutzerprofil **inkl. einzelnem Ziel** (`goal_title`, `goal_target_weight`, `goal_note`) |
| `workout_templates`, `template_exercises` | Trainingspläne und ihre Übungen (mit Sätzen/Wdh.) |
| `sessions`, `session_exercises`, `sets` | Durchgeführte Einheiten und protokollierte Sätze |
| `app_settings` | Key-Value-Speicher (KI-Anbieter, API-Keys, Analyse-Cache) |
| `chat_messages` | Verlauf des KI-Coach-Chats |

## Datenfluss-Beispiel: KI-Fortschrittsanalyse

```
Fortschritt-Tab (Präsentation)
   └─ collectAnalytics(db)              [Anwendungsschicht]
        └─ trainingSummary / weekdayDistribution / exerciseProgress …  [Datenschicht]
   └─ formatAnalyticsForAi(data)        [Anwendungsschicht]
   └─ generateAnalysis(provider, …)     [Anwendungsschicht → externe KI-API]
   └─ Diagramme (BarChart) + KI-Text rendern   [Präsentation]
```

Die rohen Zahlen liefert die Datenschicht, die Anwendungsschicht verdichtet sie
und holt die KI-Bewertung, die Präsentationsschicht stellt Diagramme und Text dar.
