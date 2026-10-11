"""Offline regression tests for the public Wartenberg municipality adapters."""
import datetime as dt
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import sync_official as official


def parse(html):
    doc=official.Tree()
    doc.feed(html)
    return doc


class OfficialParserTests(unittest.TestCase):
    def setUp(self):
        self.now=official.TODAY
        official.TODAY=dt.date(2026,10,11)
    def tearDown(self):
        official.TODAY=self.now

    def test_official_news_extracts_valid_dates_and_urls(self):
        doc=parse("""
        <section>
          <article><h3><a href="/detailansicht.html?tx_news_pi1%5Bnews%5D=62">
            Informationsbroschüre</a></h3>
            <p>28.09.2026 * Broschüre für die Einwohner der Gemeinde</p>
            <a href="/detailansicht.html?tx_news_pi1%5Bnews%5D=62">Mehr erfahren</a>
          </article>
          <a href="/detailansicht.html?tx_news_pi1%5Bnews%5D=99">nächste</a>
        </section>""")
        items=official.parse_official_news(doc,official.NEWS_URL)
        self.assertEqual(len(items),1)
        self.assertEqual(items[0]["title"],"Informationsbroschüre")
        self.assertEqual(items[0]["id"],"gemeinde-offiziell-62")
        self.assertEqual(items[0]["locality"],"Wartenberg")
        self.assertTrue(items[0]["source"].startswith("https://www.gemeinde-wartenberg.de/"))

    def test_official_calendar_date_range_and_organizer(self):
        doc=parse("""
        <a href="/kalenderdaten/detailansicht.html?tx_calendarize_calendar%5Bindex%5D=1974">
          <span>15.10 - 17.10.2026</span><div>Kirmesclub Angersbach</div>
          <strong>Kirmes in Angersbach</strong>
        </a>
        <a href="/kalenderdaten/detailansicht.html?tx_calendarize_calendar%5Bindex%5D=1976">
          <span>14.11.2026</span><div>VdK Landenhausen</div>
          <strong>Beutelchesessen</strong>
        </a>
        """)
        items=official.parse_official_events(doc,official.EVENTS_URL)
        self.assertEqual(len(items),2)
        self.assertEqual(items[0]["start"],"2026-10-15")
        self.assertEqual(items[0]["end"],"2026-10-17")
        self.assertEqual(items[0]["organizer"],"Kirmesclub Angersbach")
        self.assertEqual(items[0]["title"],"Kirmes in Angersbach")
        self.assertEqual(items[1]["location"],"Landenhausen")

    def test_variant_spellings_do_not_duplicate_club_events(self):
        a={"start":"2026-10-24","title":"Liederabend 135-jähriges Bestehen MGV Landenhausen","organizer":"Männergesangsverein Landenhausen"}
        b={"start":"2026-10-24","title":"Liederabend zum 135-jährigen Bestehen des MGV Landenhausen","organizer":"Männergesangverein Landenhausen"}
        self.assertTrue(official.same_event(a,b))
        a2={"start":"2026-12-07","title":"Preis-Schießen / Geflügel-Schießen","organizer":"Schützenabteilung Sportgemeinschaft Landenhausen"}
        b2={"start":"2026-12-07","title":"Preis- und Geflügelschießen","organizer":"Schützenabteilung Sportgemeinschaft Landenhausen"}
        self.assertTrue(official.same_event(a2,b2))
        self.assertFalse(official.same_event(
            {"start":"2026-12-12","title":"Weihnachtsmarkt","organizer":"Vereinsgemeinschaft Landenhausen"},
            {"start":"2026-12-12","title":"Weihnachtskonzert","organizer":"Musikverein Landenhausen"}))

    def test_non_official_urls_are_rejected(self):
        self.assertFalse(official.safe_official_link("https://malicious.example/",official.NEWS_URL))
        self.assertTrue(official.safe_official_link("/alle-news.html",official.NEWS_URL))
        with self.assertRaises(ValueError):
            official.fetch_document("https://malicious.example/thing")

    def test_merge_keeps_verified_description_and_better_organizer(self):
        old={"checkedAt":"2026-10-11","items":[{
            "id":"2026-event-11","start":"2026-12-12","end":"2026-12-12",
            "title":"Weihnachtsmarkt","description":"Der Weihnachtsmarkt ist für Dezember gelistet.",
            "location":"Wartenberg","organizer":"Veranstalter laut Gemeindeübersicht",
            "category":"Kultur","source":official.EVENTS_URL,
        }]}
        fresh=[{"id":"new","start":"2026-12-12","end":"2026-12-12",
            "title":"Weihnachtsmarkt","description":"","location":"Landenhausen",
            "organizer":"Vereinsgemeinschaft Landenhausen",
            "category":"Kultur","source":official.EVENTS_URL}]
        merged=official.merge_events(fresh,old)
        self.assertEqual(len(merged),1)
        self.assertEqual(merged[0]["organizer"],"Vereinsgemeinschaft Landenhausen")
        self.assertEqual(merged[0]["location"],"Landenhausen")
        self.assertIn("Dezember",merged[0]["description"])

    def test_news_merging_preserves_curated_original_link(self):
        first={"items":[{"id":"curated-v2-02","title":"Manöver der Bundeswehr",
            "source":"https://www.gemeinde-wartenberg.de/detailansicht.html?tx_news_pi1%5Bnews%5D=38&cHash=x",
            "date":"2026-10-05","publishedAt":"2026-10-05T12:00:00+02:00",
            "desc":"Redaktionelle, überprüfte Kurzfassung mit Details"}]}
        scraped=[{"id":"gemeinde-offiziell-38","title":"Manöver der Bundeswehr","date":"2026-10-05",
             "source":"https://www.gemeinde-wartenberg.de/detailansicht.html?cHash=y&tx_news_pi1%5Bnews%5D=38"}]
        merged=official.merge_news(scraped,first)
        self.assertEqual(len(merged),1)
        self.assertIn("Redaktionelle",merged[0]["desc"])


if __name__ == "__main__":
    unittest.main()
