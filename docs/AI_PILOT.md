# Wartenberg 360: kostenloser KI-Nachrichten-Pilot

Status: **isolierter Probelauf, keine automatische Veröffentlichung**.

## Ziel

Prüfen, ob ein kleines frei verfügbares Sprachmodell (Qwen3-0.6B, GGUF Q4_K_M, Apache-2.0-Basismodell) auf einem kostenlosen GitHub-Actions-Standard-Runner aus **bis zu 20 echten, legal öffentlich zugänglichen Nachrichtenartikeln** überprüfbare deutsche Kurzfassungen erstellen kann.

Automatisch in der App erscheint durch diesen Probelauf **noch kein neuer KI-Text**.

## Ablauf und Datensparsamkeit

1. Der Probelauf wählt maximal 20 echte Seiten aus den vorhandenen regionalen News-Daten aus (örtliche Quellen bevorzugt, andere Orte nur für Quelltests).
2. Nur fest erlaubte Domains werden versucht. Google-News-Links ohne aufgelöste Originalquelle, Login-Seiten und unzugängliche Artikel werden nicht über Umgehungen eingelesen. `robots.txt` wird beachtet.
3. Artikeltexte werden flüchtig im GitHub-Runner zum Modell geführt, **nicht im Repository gespeichert**.
4. Die KI erstellt eine **eigene kurze Zusammenfassung**. Keine Zeitungstexte und keine Bilder werden kopiert.
5. Automatische Tests prüfen Länge, Satzanzahl, neu erfundene Zahlen und längere wörtliche Übernahmen. Das ist **keine zuverlässige Faktenprüfung**.
6. Der Test erzeugt `data/ai_pilot_report.json` **nur als zeitlich befristetes GitHub-Actions-Artefakt**. Enthalten sind die Original-URLs, KI-Testentwürfe und Prüfmerkmale, aber keine Artikelvolltexte.

Das Artefakt eines öffentlichen GitHub-Repositories darf nicht als vertraulich betrachtet werden.

## Starten und prüfen

[GitHub Actions: kostenloser KI-Nachrichten-Test](https://github.com/Segi91/wartenberg-360/actions/workflows/ai-pilot.yml)

Der Workflow kann manuell gestartet werden; für den Ersttest wird er beim Anlegen bzw. Ändern der Testdateien einmal ausgelöst. Er hängt **nicht** am normalen Zwei-Stunden-Nachrichtenworkflow.

### Mögliche Ergebnisse

- `foundSourceTexts < 20`: Die fehlenden Artikel waren nicht im erlaubten Umfang zugänglich. Keinesfalls mit Überschriften allein weitere Fakten erfinden.
- `passesMechanicalChecks == false`: Der Testentwurf wird verworfen.
- `passesMechanicalChecks == true`: **Nur formal geprüft**; erforderlich bleibt ein Vergleich mit dem echten Quelltext auf sachliche Fehler.
- `reviewStatus: NEEDS_HUMAN_FACT_CHECK`: keine Freigabe für öffentliche Anzeige.

Vor einer möglichen Integration müssen mindestens deutsche Sprachqualität, Faktentreue, Quellenzugänglichkeit, korrekte Lizenznutzung, Kosten und wiederholbare Laufzeit anhand mehrerer Serien geprüft werden. Nach einem gelungenen Test kann eine später gewünschte Pipeline bei nicht erreichbaren Quellen automatisch auf *nur Quellenlink* zurückfallen.

## Kosten

GitHub stellt derzeit die Verwendung von **Standard-GitHub-Runnern in öffentlichen Repositorys** kostenlos bereit. Größere oder spezielle Runner sind hiervon nicht umfasst, die Bedingungen können sich ändern. Für diesen Test ist **kein kostenpflichtiger KI-API-Schlüssel** erforderlich. Modell- und Programmpakete werden auf dem Runner geladen; sie werden nicht in dieses Repository aufgenommen.

Rechts- und Datenschutzhinweis: Eine kostenlose Veröffentlichung des Originalartikels (auch eines nicht hinter einer Paywall liegenden Texts) ist ohne geeignete Rechte nicht automatisch zulässig. Zusammenfassungen sollen nur Fakten in eigener Sprache wiedergeben und Herkunft und Datum klar anzeigen.
