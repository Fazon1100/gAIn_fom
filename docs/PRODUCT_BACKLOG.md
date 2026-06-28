# Product Backlog – gAIn

Spiegelt das GitHub-Board: https://github.com/users/Fazon1100/projects/1
Status: ✅ Done · ⬜ Todo

## Umgesetzt (Done)

| Story | Beschreibung |
| --- | --- |
| **KI-Implementierung** | KI-Coach (Chat), KI-Trainingsplan-Generator und KI-Fortschrittsanalyse über eine austauschbare Anbieter-Schnittstelle. |
| **Groq als Standard-KI + API-Key hardcodieren** | Groq als Standard-Anbieter; vorkonfigurierter API-Key, damit jeder Nutzer ohne Setup sofort loslegen kann. |
| **Übungskatalog (38 Übungen)** | Durchsuch-/filterbarer Katalog mit Ausführung, Tipps, Fehlern und Alternativen. |
| **Trainings-Tracking** | Einheiten live protokollieren (Sätze/Wdh./Gewicht), abschließen oder verwerfen. |
| **Rekorde & Pausentimer** | Persönliche Rekorde, „Letztes Mal"-Anzeige, Pausenuhr mit Haptik. |
| **Trainingsplan-Verwaltung** | Eigene Pläne mit Sätzen/Wdh. anlegen, bearbeiten und starten. |
| **Fortschritts-Statistiken & Diagramme** | Frequenz, Volumen-Trend, Wochentage, Muskelgruppen, Kraftverlauf je Übung. |
| **Profil & Zielsetzung** | Profil pflegen und ein klares Hauptziel definieren, das die KI berücksichtigt. |
| **Onboarding** | Geführter Erststart: Profil, Ziel und KI-Hinweis. |
| **Layout / UX überarbeiten** | Konsistentes dunkles Design, Cleanup, Leer-/Lade-/Fehlerzustände. |
| **Schichtenarchitektur** | Trennung in Präsentation, Anwendung (KI/Analyse) und Datenschicht (SQLite). |
| **Tests & CI-Pipeline** | Unit-Tests; GitHub-Actions-CI mit Typecheck, Lint und Tests. |
| **Datenexport & Zurücksetzen** | Backup als JSON exportieren; lokale Daten zurücksetzen. |
| **iOS-Kompatibilität** | Expo-Go-Versionsabgleich, GestureHandlerRootView, SafeArea. |
| **Offline-Coach entfernen** | Nicht funktionierenden Offline-Modus entfernt; KI läuft über Groq. |
| **Körpergewicht-Tracking** | Gewicht erfassen, Verlaufskurve & Liste; letzter Wert fließt ins Profil. |
| **Stabilität & Error-Boundary** | App-weite Fehlerabsicherung mit freundlichem Hinweis statt Absturz. |
| **Voice-to-Text (Spracheingabe)** | Spracheingabe im KI-Coach via expo-audio + Groq Whisper (Deutsch). |

## Backlog (Todo)

| Story | Beschreibung |
| --- | --- |
| **Smart Watches Compatible** | Anbindung an Apple Watch / Wear OS (Workout, Sätze, Herzfrequenz). |
| **Mehrsprachigkeit (DE/EN)** | Vollständige Lokalisierung der App-Texte. |
| **Push-Erinnerungen** | Lokale Benachrichtigungen für geplante Einheiten. |
| **Backup-Import** | Exportiertes JSON-Backup importieren / wiederherstellen. |
| **Theme umschalten (Dark/Light)** | Umschaltbares Farbschema. |
| **App Store / Play Store Release** | Store-Assets, EAS-Builds und Veröffentlichung. |

## User-Story-Format

Im Sprint werden Items bei Bedarf als klassische User Story verfeinert:
> _Als <Rolle> möchte ich <Funktion>, um <Nutzen>._ — mit testbaren Akzeptanzkriterien
> (siehe [Definition of Done](DEFINITION_OF_DONE.md)).
