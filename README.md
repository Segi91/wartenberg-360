# Wartenberg 360 · Version 2.0

**Deine kostenlose digitale Ortszentrale für Angersbach und Landenhausen** in Wartenberg (Hessen, PLZ 36367).

**App:** https://segi91.github.io/wartenberg-360/

Wartenberg 360 ist ein **unabhängiges privates Bürgerprojekt**, keine offizielle Website der Gemeinde.

## Was ist neu in Version 2.0?

- **Nachrichten aus Wartenberg zuerst:** direkte Ortsmeldungen aus Angersbach, Landenhausen und Wartenberg; der restliche Vogelsberg bleibt gesondert anwählbar.
- **Kein reiner Sport-Feed:** acht Themengebiete neben allgemeinen Regionalmeldungen: Rathaus & Politik, Kultur & Musik, Gemeinschaft & Ehrenamt, Familie & Soziales, Natur & Umwelt, Verkehr & Bauen, Blaulicht, Sport.
- **„Abseits des Spielfelds“:** erste Nachrichtenkarten zeigen bewusst vielfältige nicht-sportliche Themen, Sport bleibt als eigener Schwerpunkt erhalten.
- **Quellengebunden:** automatisierte RSS-/Nachrichtenindex-Suche ergänzt um datierte, geprüfte Originalartikel aus dem örtlichen Vereins- und Gemeindeleben, auch aus älteren Monaten. Paywalls werden nicht umgangen. Keine Volltexte oder fremde Pressefotos.
- **Vereine & Initiativen:** ausgebautes Verzeichnis mit 38 Einträgen in beiden Ortsteilen – von Kultur, Musik und Ehrenamt bis Jugend, Feuerwehr, Natur und Sport. Filter nach Ortsteil und Aktivität.
- **Ortsführer:** ausgewählte öffentliche Orte mit Quellen- und Kartenlinks. Saisonale Öffnungszeiten bitte beim Betreiber prüfen.
- **Persönliche Startseite:** unter Einstellungen Nachrichtenschwerpunkt Ausgewogen / Kultur & Vereine / Rathaus & Alltag / Lokalsport auswählen. Die Einstellung wird nur im eigenen Browser gespeichert.
- **Offline-Unterstützung:** App-Hülle und zuletzt empfangene Nachrichten können bei erneuter Nutzung aus dem lokalen Cache verfügbar sein; Live-Wetter erfordert Internet.

Die bewährten Bereiche **Wetter**, **Veranstaltungskalender mit ICS-Export**, **Abfallkalender**, **Notrufe und Rathauskontakte** sowie die responsive Android-/Desktop-Navigation bleiben erhalten.

## Datenstand und Grenzen

- **Wetter:** kostenlose Open-Meteo-Schnittstelle, online; mit lokal gespeicherter letzter Prognose.
- **Nachrichten:** GitHub Actions prüft bei möglichen Quellen ungefähr alle zwei Stunden. Ein fehlgeschlagener Abruf bewahrt die zuletzt erfolgreich gespeicherten Artikel; es gibt keine Garantie, dass jeder Artikel aller Quellen sofort auftaucht.
- **Kulturverein Landenhausen:** offizielle Vereins-Website unter https://kulturverein-landenhausen.de/ ist verlinkt; bisher kein zuverlässig abrufbarer Direkt-RSS-Feed. Andere Vereine sind zum Teil ausschließlich über Nachrichtenindizes oder recherchierte Einzellinks vertreten.
- **Gemeinde Wartenberg:** redaktionell geprüfte Ortsmitteilungen und Originalquelle; ein direkter automatischer Gemeinde-News-Feed ist bisher nicht verlässlich verfügbar.
- **Lauterbacher Anzeiger:** lokaler Suchindex und ausgewählte Artikel; einzelne Originalartikel erfordern ein Abonnement. Die App versucht nicht, Bezahlschranken zu umgehen.
- **Nachrichtenarchiv:** ältere Berichte werden als *Archiv* gekennzeichnet, nicht als aktuelle Breaking News.
- **Veranstaltungen und Abfall:** redaktionell übernommene Termine vom 11. Oktober 2026, **kein automatischer Live-Abgleich**. Verbindliche Abfuhrtermine für die konkrete Straße beim [ZAV](https://www.zav-online.de/gemeinde-wartenberg-termine) prüfen. Veranstaltungszeiten und -ausfälle immer beim Veranstalter prüfen.
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
