#!/usr/bin/env python3
"""Wartenberg 360: Quellengebundener RSS-/Nachrichtenindex, keine Artikel-Volltexte."""
from __future__ import annotations

import datetime as dt
import email.utils
import hashlib
import html
import json
from pathlib import Path
import re
import time
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET
from news_topics import normalize, is_local, TOPICS

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "news.json"
UTC = dt.timezone.utc
NOW = dt.datetime.now(UTC)
MAX_DAYS = 45
LOCAL_ARCHIVE_DAYS = 270
REGION = ("wartenberg", "angersbach", "landenhausen", "vogelsberg",
          "lauterbach", "alsfeld", "schlitz", "herbstein", "schotten",
          "grebenhain", "mücke", "hosenfeld", "lautertal", "feldatal",
          "ulrichstein", "kirtorf", "romrod", "grebenau", "antrifttal")
LOCAL = ("wartenberg", "angersbach", "landenhausen")

SOURCES = [
    dict(id="gemeinde", name="Gemeinde Wartenberg",
         url="https://www.gemeinde-wartenberg.de/alle-news.html", domain="gemeinde-wartenberg.de",
         category="Gemeinde", site_only=True, direct=[]),
    dict(id="kreis", name="Vogelsbergkreis", url="https://www.vogelsbergkreis.de/",
         domain="vogelsbergkreis.de", category="Vogelsberg", site_only=True,
         direct=["https://www.lifepr.de/rss/pressemitteilungen/newsroom/kreisausschuss-des-vogelsbergkreises"]),
    dict(id="polizei", name="Polizeipräsidium Osthessen",
         url="https://www.presseportal.de/blaulicht/nr/43558", domain="presseportal.de",
         category="Blaulicht", site_only=False,
         direct=["https://www.presseportal.de/rss/dienststelle_43558.rss2"]),
    dict(id="oberhessen", name="Oberhessen-live",
         url="https://www.oberhessen-live.de/vogelsberg/", domain="oberhessen-live.de",
         category="Vogelsberg", site_only=False,
         direct=["https://www.oberhessen-live.de/feed/"]),
    dict(id="osthessen", name="Osthessen News", url="https://osthessen-news.de/",
         domain="osthessen-news.de", category="Vogelsberg", site_only=False, direct=[]),
    dict(id="fulda", name="Fuldaer Zeitung",
         url="https://www.fuldaerzeitung.de/vogelsberg/", domain="fuldaerzeitung.de",
         category="Vogelsberg", site_only=False, direct=[]),
    dict(id="la", name="Lauterbacher Anzeiger",
         url="https://www.lauterbacher-anzeiger.de/vogelsbergkreis/wartenberg/",
         domain="lauterbacher-anzeiger.de", category="Gemeinde", site_only=False,
         direct=[], search_query='site:lauterbacher-anzeiger.de (Wartenberg OR Angersbach OR Landenhausen OR "TV Angersbach" OR "SG Landenhausen" OR "JSG Wartenberg") when:90d'),
    dict(id="winfo", name="Wartenberg-iNFO", url="https://www.wartenberg-info.de/",
         domain="wartenberg-info.de", category="Gemeinde", site_only=True,
         direct=["https://www.wartenberg-info.de/feed/"]),
]

def google_rss(source):
    query = source.get("search_query") or ("site:" + source["domain"])
    if not source["site_only"] and not source.get("search_query"):
        query += " (Vogelsberg OR Wartenberg OR Angersbach OR Landenhausen OR Lauterbach OR Alsfeld OR Schlitz OR Herbstein OR Schotten OR Grebenhain)"
    if "when:" not in query:
        query += " when:30d"
    return "https://news.google.com/rss/search?" + urlencode({
        "q": query, "hl": "de", "gl": "DE", "ceid": "DE:de"})

def fetch_feed(url):
    request = Request(url, headers={
        "User-Agent": "Wartenberg360/1.0 (+https://github.com/Segi91/wartenberg-360)",
        "Accept": "application/rss+xml,application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.3"})
    with urlopen(request, timeout=18) as response:
        if response.status != 200:
            raise ValueError("HTTP " + str(response.status))
        content = response.read(1_500_001)
        if len(content) > 1_500_000:
            raise ValueError("Feed too large")
        if not any(tag in content[:3000] for tag in (b"<rss", b"<feed", b"<rdf:RDF")):
            raise ValueError("Not a feed")
        return content

def child(node, *names):
    for name in names:
        for element in node.iter():
            if element is node or element.tag.rsplit("}", 1)[-1] != name:
                continue
            if name == "link" and element.attrib.get("href"):
                return element.attrib["href"]
            if element.text and element.text.strip():
                return element.text.strip()
    return ""

def plain(value):
    value = re.sub(r"<[^>]*>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()

def parse_date(value):
    if not value:
        return None
    try:
        date = email.utils.parsedate_to_datetime(value)
    except (TypeError, ValueError):
        try:
            date = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    if date.tzinfo is None:
        date = date.replace(tzinfo=UTC)
    return date.astimezone(UTC)

def safe_link(link):
    parsed = urlparse(link)
    return parsed.scheme == "https" and bool(parsed.hostname) and not parsed.username and not parsed.password

def classify(title, summary, source):
    content = (title + " " + summary).casefold()
    local = any(term in title.casefold() for term in LOCAL) or source["id"] in ("gemeinde", "winfo")
    location = "Wartenberg" if local else "Vogelsberg"
    if source["id"] == "polizei":
        return "Blaulicht", location
    if any(term in content for term in ("verein", "fußball", "fussball", "tennis", "sport", "bundesliga", "sg landenhausen", "tv angersbach", "jsg wartenberg", "fsg wartenberg", "tischtennis", "schützen")):
        return "Vereine", location
    if any(term in content for term in ("sperrung", "verkehr", "straße", "strasse", "unfall", "baustelle")):
        return "Verkehr", location
    return ("Gemeinde" if local else source["category"]), location

def parse_feed(xml, source, via):
    root = ET.fromstring(xml)
    entries = [e for e in root.iter() if e.tag.rsplit("}", 1)[-1] in ("item", "entry")]
    articles = []
    for entry in entries[:90]:
        title = plain(child(entry, "title"))
        url = plain(child(entry, "link"))
        published = parse_date(child(entry, "pubDate", "published", "updated", "date"))
        summary = plain(child(entry, "description", "summary"))
        if via == "Google News":
            suffix = " - " + source["name"]
            if title.endswith(suffix):
                title = title[:-len(suffix)]
        if not title or not safe_link(url) or not published:
            continue
        limit_days = LOCAL_ARCHIVE_DAYS if source["id"] == "la" else MAX_DAYS
        if published > NOW + dt.timedelta(hours=5) or published < NOW - dt.timedelta(days=limit_days):
            continue
        if source["id"] == "la":
            # Lauterbacher Anzeiger focuses on Wartenberg; never mix unrelated
            # Lauterbach/Vogelsberg headlines into the local source.
            if not any(term in title.casefold() for term in LOCAL):
                continue
        elif not source["site_only"]:
            # News-index descriptions can contain unrelated headlines:
            # require regional place names in the HEADLINE itself for indexed feeds.
            text = title if via == "Google News" else title + " " + summary
            if not any(term in text.casefold() for term in REGION):
                continue
        host = urlparse(url).hostname or ""
        if via == "Google News":
            if host not in ("news.google.com", "www.google.com") and not (
                host == source["domain"] or host.endswith("." + source["domain"])):
                continue
        elif host != source["domain"] and not host.endswith("." + source["domain"]) and not (
                source["id"] == "kreis" and host.endswith("lifepr.de")):
            continue
        category, locality = classify(title, summary, source)
        article_id = hashlib.sha256((source["id"] + "\n" + url).encode()).hexdigest()[:16]
        articles.append(dict(
            id=article_id, title=title[:220], desc="", date=published.date().isoformat(),
            publishedAt=published.isoformat(timespec="seconds"),
            category=category, locality=locality, sourceName=source["name"],
            sourceId=source["id"], source=url, via=via))
    return articles

def run():
    try:
        previous = json.loads(OUTPUT.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        previous = {}
    old = {x["id"]: normalize(x) for x in previous.get("items", [])
           if isinstance(x, dict) and x.get("id") and x.get("title") and x.get("source")
           and (x.get("sourceId") != "la" or is_local(x.get("title")) or x.get("editorial"))
           and not (x.get("sourceId") == "winfo" and x.get("title", "").strip().casefold() in ("wetter", "startseite", "abfallkalender"))}
    try:
        collection = json.loads((ROOT / "data" / "curated_news.json").read_text(encoding="utf-8"))
        curated = [normalize(dict(x, editorial=True)) for x in collection.get("items", [])
                   if isinstance(x, dict) and x.get("id") and x.get("title")
                   and re.fullmatch(r"\d{4}-\d{2}-\d{2}", x.get("date", "")) and safe_link(x.get("source", ""))]
    except (OSError, ValueError):
        curated = []
    curated_urls = {x["source"] for x in curated}
    old = {k:v for k,v in old.items() if v.get("source") not in curated_urls}
    for item in curated:
        old[item["id"]] = item
    statuses = []
    success = 0
    for source in SOURCES:
        articles = []
        via = ""
        errors = []
        candidates = [(url, "RSS") for url in source["direct"]] + [(google_rss(source), "Google News")]
        for url, method in candidates:
            try:
                found = parse_feed(fetch_feed(url), source, method)
                if found:
                    articles, via = found, method
                    break
                errors.append(method + ": keine aktuellen passenden Artikel")
            except Exception as ex:
                errors.append(method + ": " + type(ex).__name__)
        if articles:
            articles = list({article['id']: article for article in articles}.values())[:70]
            success += 1
            for article in articles:
                old[article["id"]] = normalize(article)
        statuses.append(dict(id=source["id"], name=source["name"], url=source["url"],
                             mode=via if articles else "Nur Quelle",
                             count=len(articles), note="; ".join(errors)[:180] if not articles else ""))
        print(source["name"] + ": " + str(len(articles)) + " Artikel, " + (via or "Quelllink"))
        time.sleep(0.1)
    if not success and previous.get("updatedAt"):
        print("Kein Feed verfügbar: letzte erfolgreiche Daten beibehalten")
        return
    oldest = (NOW - dt.timedelta(days=MAX_DAYS)).date().isoformat()
    local_oldest = (NOW - dt.timedelta(days=LOCAL_ARCHIVE_DAYS)).date().isoformat()
    items = [x for x in old.values()
             if x.get("date", "") >= (local_oldest if (x.get("locality") == "Wartenberg" or x.get("editorial")) else oldest)
             and safe_link(x.get("source", ""))
             and (x.get("sourceId") in ("gemeinde", "kreis", "winfo")
                  or x.get("via") != "Google News"
                  or any(term in x.get("title", "").casefold() for term in REGION))]
    items.sort(key=lambda item: item.get("publishedAt", item["date"]), reverse=True)
    # Cross-source duplicate titles from the same day
    seen = set()
    unique = []
    source_counts = {}
    for item in items:
        key = (item["date"], re.sub(r"\W+", "", item["title"].casefold())[:95])
        publisher = item.get("sourceId", "other")
        if key in seen or source_counts.get(publisher, 0) >= (75 if publisher == "la" else 45):
            continue
        seen.add(key)
        source_counts[publisher] = source_counts.get(publisher, 0) + 1
        unique.append(item)
    unique = unique[:260]
    for status in statuses:
        stored = sum(1 for article in unique if article.get("sourceId") == status["id"])
        status["stored"] = stored
        if status["count"] == 0 and stored:
            status["mode"] = "Gepruefte Links / Archiv"
    topic_counts = {topic: sum(1 for article in unique
                   if article.get("locality") == "Wartenberg" and article.get("topic") == topic)
                   for topic in TOPICS}
    result = dict(version=2,
                  updatedAt=NOW.isoformat(timespec="seconds").replace("+00:00", "Z") if success else previous.get("updatedAt"),
                  items=unique, sources=statuses, feedCount=success,
                  localCount=sum(1 for article in unique if article.get("locality") == "Wartenberg"),
                  localTopics=topic_counts,
                  note="Automatischer Feed plus quellengepruefte, datierte Artikelverweise. Keine fremden Volltexte oder Bilder.")
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Gespeichert:", len(unique), "Nachrichten von", success, "Quellen.")

if __name__ == "__main__":
    run()
