# Definition of Ready & Definition of Done

## Definition of Ready (DoR)

Eine User Story ist **bereit** für einen Sprint, wenn:

- [ ] Sie als „Als … möchte ich … um …" formuliert ist
- [ ] **Akzeptanzkriterien** vorhanden und testbar sind
- [ ] Sie geschätzt (Story Points) und klein genug für einen Sprint ist
- [ ] Abhängigkeiten und offene Fragen geklärt sind
- [ ] Der Nutzen / die Priorität durch den PO bestätigt ist

## Definition of Done (DoD)

Ein Backlog-Item ist **fertig**, wenn:

### Funktional
- [ ] Alle Akzeptanzkriterien erfüllt
- [ ] Auf einem echten Gerät (iPhone / Expo Go) manuell getestet
- [ ] Sinnvolle Leer-, Lade- und Fehlerzustände vorhanden

### Code-Qualität
- [ ] TypeScript ohne Fehler (`npm run typecheck`)
- [ ] Linter ohne neue Warnungen (`npm run lint`)
- [ ] Code folgt der Schichtenarchitektur (Präsentation / Anwendung / Daten)
- [ ] Keine offensichtlichen Toten-Code-/TODO-Reste

### Tests
- [ ] Unit-Tests für neue Logik der Anwendungsschicht vorhanden
- [ ] Gesamte Test-Suite grün (`npm test`)
- [ ] CI-Pipeline (GitHub Actions) erfolgreich

### Dokumentation & Übergabe
- [ ] Nutzerseitige Texte auf Deutsch und verständlich
- [ ] Relevante Doku aktualisiert (README / ARCHITECTURE / Backlog-Status)
- [ ] Änderung committet & gepusht, Issue/Board aktualisiert

## Projekt-DoD (Abnahmebereitschaft)

Das Gesamtprodukt ist **abnahmebereit**, wenn zusätzlich:

- [ ] Onboarding für Erstnutzer:innen vorhanden
- [ ] App startet leer (keine Testdaten) und ist sofort bedienbar
- [ ] App ohne Internet/Account vollständig bedienbar
- [ ] Datenexport (Backup) möglich
- [ ] `app.json` store-tauglich konfiguriert (Icons, Splash, Bundle-IDs, Version)
