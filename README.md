# Wartenberg 360 · Version 2.2

**Deine kostenlose digitale Ortszentrale für Angersbach und Landenhausen** in Wartenberg (Hessen, PLZ 36367).

**App:** https://segi91.github.io/wartenberg-360/

Wartenberg 360 ist ein **unabhängiges privates Bürgerprojekt**, keine offizielle Website der Gemeinde.

## Version 2.2 – Gemeindequellen direkt, ohne KI

- **KI-Automatik deaktiviert:** Der experimentelle Qwen-Pilot-Workflow ist aus dem Repository entfernt. Es gibt keine automatische KI-Zusammenfassung und keine laufenden KI-API-Kosten.
- **Amtliche Nachrichten:** Der regelmäßige GitHub-Actions-Durchlauf liest zusätzlich die öffentlich sichtbaren Nachrichten-Indexseiten der Gemeinde Wartenberg. Neue amtliche Meldungen werden als Titel, Datum, kurze amtliche Ankündigung und direkte Originalquelle verlinkt; der Zugriff auf Volltexte oder eine KI-Paraphrase ist nicht erforderlich. Wenn das Layout geändert wird oder der Abruf scheitert, bleibt der letzte sichere Datenstand.
- **Veranstaltungen automatisch abgeglichen:** In demselben ungefähr zweistündlichen Durchlauf werden die veröffentlichten Einträge des offiziellen Gemeindekalenders erfasst, inklusive Original-Detailseite. Vorhandene, sorgfältig formulierte Kurzbeschreibungen bleiben erhalten. Neue Einträge erhalten keine erfundenen Uhrzeiten oder Adressen. Mehrdeutige/doppelte Termine werden konservativ zusammengeführt.
- **Vereinsprofile verknüpft:** Die App zeigt zu passenden Vereinen die bekannten zukünftigen Termine und örtlichen Schlagzeilen direkt im internen Profil. Kontakte und tatsächlich aktuelle Trainingszeiten müssen bei Bedarf beim Verein bzw. in der offiziellen Gemeindeübersicht geprüft werden.
- **Bedienung:** Veranstaltungsfilter nach Ortsteil und Art, deutlicherer Datenstand, Aktualisieren-Knopf und mobileoptimierte Kurzangaben. Nachrichtentexte ohne eigene geprüfte Zusammenfassung bleiben reine Quellenlinks; leere Leseransichten werden nicht geöffnet.

**Verwendete Originalquellen:**
[Nachrichten der Gemeinde](https://www.gemeinde-wartenberg.de/alle-news.html) und
[Gemeindekalender](https://www.gemeinde-wartenberg.de/kalenderdaten/alle-termine.html).

**Wichtig:** Automatisches Abgleichen heißt nicht, dass Termine bestätigt stattfinden oder jeder Ortsverein einen aktuellen Online-Kalender hat. Der Stand ist in der App ausgewiesen. Die offizielle Quelle bleibt für Änderungen maßgeblich.

## Neu in Version 2.1: direkt in der App lesen

**Nachrichten:** Die Karten öffnen über „Lesen“ oder einen Klick auf die Karte einen integrierten Nachrichtenleser. Er zeigt Titel, Erscheinungsdatum, Ort, Quelle und – bei den 21 quellengeprüften Ortsmeldungen – eigenständig geschriebene inhaltliche Zusammenfassungen. Automatisch übernommene RSS-/Index-Artikel ohne geprüfte Zusammenfassung lassen sich nicht in einer leeren Leseransicht öffnen; sie verweisen direkt auf die Originalquelle. Der vollständige Originalartikel bleibt beim Herausgeber, einschließlich etwaiger Paywall.

**Bilder und Rechte:** Die dekorativen Rubrik-Symbole in der Leseansicht sind **keine Original-Pressefotos**. Fremde Fotos werden nur eingebunden, wenn eine belegte passende Lizenz/Berechtigung und eine korrekte Quellen- und Urheberangabe vorliegen. Eine bloße Verlinkung würde die Rechte an vollständigen Artikeln und Pressebildern nicht aufheben.

**Sortierung:** Im Nachrichtenbereich gibt es die explizite Auswahl „Neueste zuerst“ / „Älteste zuerst“. Die Auswahl wird im Browser gespeichert. Der unerwünschte Hinweistext oberhalb der Themenfilter wurde entfernt.

**Vereine:** 49 örtliche Vereine, Gruppen und Vereinsabteilungen einschließlich Nach­wuchs­gruppen sowie der zusätzlich gemeldeten Freibad-Fördergemeinschaft. Ein Klick auf „Verein ansehen“ öffnet das interne Profil mit Ortsteil, Tätigkeitsbereich und einer eigenständig erstellten Kurzbeschreibung. Wenn der Verein eine Website hat, ist sie als Zusatz verlinkt; Mitgliedschaft, aktuelle Ansprechpartner und Trainingszeiten können externe Prüfung erfordern.

**Termine:** 12 überprüfte, kommende Veranstaltungsdaten aus der öffentlich zugänglichen Gemeindeübersicht (Stand 11.10.2026) als lokaler JSON-Datenbestand unter `data/events.json`; Termin-Karten haben die Schaltfläche „Details“ mit Veranstalter, Datum, Kurzbeschreibung und Kalenderexport. Seit Version 2.2 werden die Einträge regelmäßig mit der offiziellen Gemeindeseite abgeglichen. Eine Bestätigung einzelner Veranstaltungen oder sofortige Aktualität kann trotzdem nicht garantiert werden.

Die App ist weiterhin eine kostenlose GitHub-Pages-PWA ohne nutzerseitige Anmeldung.

## Was ist neu in Version 2.0?

- **Nachrichten aus Wartenberg zuerst:** direkte Ortsmeldungen aus Angersbach, Landenhausen und Wartenberg; der restliche Vogelsberg bleibt gesondert anwählbar.
- **Themenfilter:** acht Themengebiete neben allgemeinen Regionalmeldungen: Rathaus & Politik, Kultur & Musik, Gemeinschaft & Ehrenamt, Familie & Soziales, Natur & Umwelt, Verkehr & Bauen, Blaulicht, Sport.
- **Thematisch gemischte Nachrichten:** Auf der Startseite erscheinen aktuelle Meldungen aus unterschiedlichen Ortsbereichen.
- **Quellengebunden:** automatisierte RSS-/Nachrichtenindex-Suche ergänzt um datierte, geprüfte Originalartikel aus dem örtlichen Vereins- und Gemeindeleben, auch aus älteren Monaten. Paywalls werden nicht umgangen. Keine Volltexte oder fremde Pressefotos.
- **Vereine & Initiativen:** ausgebautes Verzeichnis mit 49 Einträgen einschließlich Abteilungen in beiden Ortsteilen – von Kultur, Musik und Ehrenamt bis Jugend, Feuerwehr, Natur und Sport. Filter nach Ortsteil und Aktivität.
- **Ortsführer:** ausgewählte öffentliche Orte mit Quellen- und Kartenlinks. Saisonale Öffnungszeiten bitte beim Betreiber prüfen.
- **Persönliche Startseite:** unter Einstellungen Nachrichtenschwerpunkt Ausgewogen / Kultur & Vereine / Rathaus & Alltag / Lokalsport auswählen. Die Einstellung wird nur im eigenen Browser gespeichert.
- **Offline-Unterstützung:** App-Hülle und zuletzt empfangene Nachrichten können bei erneuter Nutzung aus dem lokalen Cache verfügbar sein; Live-Wetter erfordert Internet.

Die bewährten Bereiche **Wetter**, **Veranstaltungskalender mit ICS-Export**, **Abfallkalender**, **Notrufe und Rathauskontakte** sowie die responsive Android-/Desktop-Navigation bleiben erhalten.

## Datenstand und Grenzen

- **Wetter:** kostenlose Open-Meteo-Schnittstelle, online; mit lokal gespeicherter letzter Prognose.
- **Nachrichten:** GitHub Actions prüft bei möglichen Quellen ungefähr alle zwei Stunden und gleicht amtliche Ortsmeldungen direkt mit der Gemeinde ab. Ein fehlgeschlagener Abruf bewahrt die zuletzt erfolgreich gespeicherten Artikel; es gibt keine Garantie, dass jeder Artikel aller Quellen sofort auftaucht.
- **Kulturverein Landenhausen:** offizielle Vereins-Website unter https://kulturverein-landenhausen.de/ ist verlinkt; bisher kein zuverlässig abrufbarer Direkt-RSS-Feed. Andere Vereine sind zum Teil ausschließlich über Nachrichtenindizes oder recherchierte Einzellinks vertreten.
- **Gemeinde Wartenberg:** redaktionell geprüfte Ortsmitteilungen und Originalquelle; ein direkter automatischer Gemeinde-News-Feed ist bisher nicht verlässlich verfügbar.
- **Lauterbacher Anzeiger:** lokaler Suchindex und ausgewählte Artikel; einzelne Originalartikel erfordern ein Abonnement. Die App versucht nicht, Bezahlschranken zu umgehen.
- **Nachrichtenarchiv:** ältere Berichte werden als *Archiv* gekennzeichnet, nicht als aktuelle Breaking News.
- **Veranstaltungen und Abfall:** Veranstaltungstermine werden nun automatisch aus dem offiziellen Gemeindekalender nachgeladen, soweit dessen Seiten erreichbar sind. Die Abfallvorschau ist weiterhin redaktionell. Verbindliche Abfuhrtermine für die konkrete Straße beim [ZAV](https://www.zav-online.de/gemeinde-wartenberg-termine) prüfen. Veranstaltungszeiten und -ausfälle immer beim Veranstalter prüfen.
- **Keine Nutzerkonten** und kein app-eigenes Tracking. Google Maps, Nachrichtenquellen und Open-Meteo sind externe Dienste, die beim Öffnen/Abrufen Daten empfangen können.

## Nachrichtenquellen

1. [Gemeinde Wartenberg](https://www.gemeinde-wartenberg.de/alle-news.html)
2. [Lauterbacher Anzeiger – Wartenberg](https://www.lauterbacher-anzeiger.de/vogelsbergkreis/wartenberg/)
3. [Kulturverein Landenhausen](https://kulturverein-landenhausen.de/)
4. [Wartenberg-iNFO](https://www.wartenberg-info.de/)
5. [Oberhessen-live](https://www.oberhessen-live.de/)
6. [Vogelsbergkreis](https://www.vogelsbergkreis.de/)
7. [Polizeipräsidium Osthessen](https://www.presseportal.de/blaulicht/nr/43558)
8. [Osthessen News](https://osthessen-news.de/)
9. [Fuldaer Zeitung](https://www.fuldaerzeitung.de/vogelsberg/)

Nicht jede Quelle bietet eine verfügbare Schnittstelle. Unter **Nachrichten → Transparenz & Quellen** zeigt die App an, wie viele Einträge tatsächlich verfügbar sind.

## Technik und Betrieb

Statische HTML/CSS/JavaScript-PWA ohne kostenpflichtige externe Dienste. GitHub Pages aus dem öffentlichen `main`-Branch (`/(root)`).

- **News-Script:** `python3 scripts/update_news.py` (Standardbibliothek, keine Python-Drittanbieter-Abos)
- **Themenregeln:** `scripts/news_topics.py`
- **Kuratierter Ortsbestand:** `data/curated_news.json`
- **Aktualisierte Artikel:** `news.json`
- **Tests:** `node --check app.js`, `python3 -m py_compile scripts/update_news.py scripts/news_topics.py`, `node tests/smoke.cjs`
- **Automatik:** `.github/workflows/update-news.yml`
- **Qualitätssicherung:** `.github/workflows/verify-v2.yml`

## Installation

Auf Android in Chrome die App öffnen und im Browsermenü **Zum Startbildschirm hinzufügen** oder **App installieren** auswählen. Auf Windows in Chrome oder Edge **App installieren** bzw. eine Verknüpfung anlegen.

Nach einer Veröffentlichung kann bei alter Anzeige ein neues Laden mit **Strg+F5** oder einmaliges Schließen und Neuöffnen der installierten PWA notwendig sein.
