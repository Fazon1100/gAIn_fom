# gAIn 💪🤖

**Smarter Trainingsbegleiter** – plane Workouts, tracke jeden Satz und erhalte eine
KI-gestützte Auswertung deines Fortschritts. Funktioniert vollständig **offline**.

![CI](https://github.com/Fazon1100/gAIn_fom/actions/workflows/ci.yml/badge.svg)

> Hochschul-Projekt (Anwendungsprojekt). Entwickelt mit Expo / React Native,
> lokaler SQLite-Datenbank und einer austauschbaren KI-Schnittstelle.

---

## ✨ Features

| Bereich | Funktion |
| --- | --- |
| **Training** | Einheiten aus Plänen starten, Sätze/Wdh./Gewicht live tracken |
| **Live-Session** | „Letztes Mal"-Anzeige, Rekord-Erkennung 🏆, Pausenuhr mit Haptik |
| **Übungskatalog** | 38 Übungen mit Beschreibung, Ausführung, Tipps & Alternativen |
| **Pläne** | Eigene Pläne mit Sätzen/Wdh. oder per KI generieren lassen |
| **KI-Coach** | Chat zu Training & Ernährung – online (Gemini/Groq/Claude) **oder offline** |
| **Fortschritt** | Statistiken, Diagramme (Frequenz, Volumen, Muskelgruppen, Kraftverlauf) + KI-Analyse |
| **Profil & Ziel** | Ein klares Hauptziel, das die KI in allen Funktionen berücksichtigt |
| **Daten** | Demo-Daten laden, Backup als JSON exportieren, alles lokal & ohne Account |

## 🚀 Schnellstart (Demo auf dem iPhone)

Voraussetzungen: [Node.js](https://nodejs.org) (LTS) und die **Expo Go**-App auf dem iPhone.

```bash
npm install
npx expo start
```

Danach den QR-Code mit der Kamera/Expo Go scannen. Beim ersten Start führt ein
**Onboarding** durch Profil, Ziel und KI-Setup. Anschließend legst du im Tab „Pläne"
deinen ersten Trainingsplan an (oder lässt ihn von der KI erstellen) und startest dein
Training.

> Die KI läuft standardmäßig im **Offline-Coach**-Modus – kein API-Schlüssel nötig.
> Optional kann im Profil ein kostenloser Anbieter (Google Gemini, Groq) hinterlegt werden.

## 🧱 Architektur

Saubere **Schichtenarchitektur** – Details in [ARCHITECTURE.md](ARCHITECTURE.md):

- **Präsentationsschicht** – `app/`, `components/`, `context/`, `constants/`
- **Anwendungsschicht** – `lib/application/` (KI, Analyse, Übungskatalog)
- **Datenschicht** – `lib/data/` (SQLite-Schema, Repository, Modelle)

## 🛠️ Tech-Stack

- **Expo SDK 54** / **React Native 0.81** / **TypeScript**
- **expo-router** (dateibasiertes Routing)
- **expo-sqlite** (lokale Persistenz)
- KI via `fetch` (Google Gemini, Groq, Anthropic) + eingebauter Offline-Modus

## 📜 Skripte

```bash
npm start          # Expo Dev-Server
npm run typecheck  # TypeScript prüfen
npm test           # Unit-Tests (Jest)
npm run lint       # ESLint
```

## ✅ Qualität

- **Typsicher**: strikte TypeScript-Prüfung
- **Getestet**: Unit-Tests für KI-/Analyse-Logik (`__tests__/`)
- **CI**: GitHub Actions prüft Typecheck, Lint & Tests bei jedem Push/PR
- **Definition of Done**: siehe [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md)

## 📋 Projektmanagement (Scrum)

Die agile Planung liegt versioniert im Repo unter [`docs/`](docs/):

- [Produktvision](docs/PRODUCT_VISION.md)
- [Rollen & Team](docs/ROLES.md)
- [Product Backlog](docs/PRODUCT_BACKLOG.md) (Epics, User Stories, Akzeptanzkriterien)
- [Sprints & Reviews](docs/SPRINTS.md)
- [Definition of Done](docs/DEFINITION_OF_DONE.md)

## 🔒 Datenschutz

Alle Daten werden ausschließlich **lokal** auf dem Gerät gespeichert (SQLite). Es gibt
keinen Account und kein Cloud-Sync. Details: [PRIVACY.md](PRIVACY.md).
