#!/usr/bin/env python3
"""Wartenberg 360: official municipal announcements + calendar sync, no AI.

Official public index pages are the source of truth. Never infer missing times,
addresses or full articles. Existing editorial entries are preserved.
A changed site structure must fail safely without replacing good data.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import html
from html.parser import HTMLParser
import json
import re
from pathlib import Path
import sys
import time
from urllib.error import URLError, HTTPError
from urllib.parse import parse_qs, unquote, urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
NEWS_FILE = ROOT / "news.json"
EVENTS_FILE = ROOT / "data/events.json"
ORIGIN = "https://www.gemeinde-wartenberg.de"
EVENTS_URL = ORIGIN + "/kalenderdaten/alle-termine.html"
NEWS_URL = ORIGIN + "/alle-news.html"
HOME_URL = ORIGIN + "/"
TODAY = dt.date.today()
USER_AGENT = "Wartenberg360/2.2 (+https://github.com/Segi91/wartenberg-360)"
MAX_BYTES = 800_000
DATE = re.compile(r"\b(\d{2})\.(\d{2})\.(20\d{2})\b")
EVENT_DATE = re.compile(
    r"^\s*(\d{2})\.(\d{2})\s*(?:[–-]\s*(\d{2})\.(\d{2}))?\.(20\d{2})"
)
REGION = ("wartenberg", "angersbach", "landenhausen")


class Node:
    __slots__ = ("tag", "attrs", "parent", "children")
    def __init__(self, tag, attrs=None, parent=None):
        self.tag = tag
        self.attrs = dict(attrs or [])
        self.parent = parent
        self.children = []


class Tree(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
            "meta", "param", "source", "track", "wbr"}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.stack = [self.root]
        self.anchors = []
    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.stack[-1])
        self.stack[-1].children.append(node)
        if tag == "a":
            self.anchors.append(node)
        if tag not in self.VOID:
            self.stack.append(node)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)
    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return
    def handle_data(self, data):
        if data and data.strip() and self.stack[-1].tag not in ("script", "style"):
            self.stack[-1].children.append(data)


def segments(node):
    for child in node.children:
        if isinstance(child, str):
            v = re.sub(r"\s+", " ", html.unescape(child)).strip()
            if v:
                yield v
        else:
            yield from segments(child)


def text(node):
    return " ".join(segments(node)).strip()


def fetch_document(url):
    p = urlparse(url)
    if p.scheme != "https" or p.hostname not in ("gemeinde-wartenberg.de", "www.gemeinde-wartenberg.de"):
        raise ValueError("Invalid official host")
    req = Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9",
    })
    with urlopen(req, timeout=18) as response:
        redirected = urlparse(response.geturl())
        if redirected.hostname not in ("gemeinde-wartenberg.de", "www.gemeinde-wartenberg.de"):
            raise ValueError("Unexpected redirect")
        content = response.read(MAX_BYTES + 1)
        if len(content) > MAX_BYTES:
            raise ValueError("Page is too large")
        declared = response.headers.get_content_charset() or "utf-8"
    tree = Tree()
    tree.feed(content.decode(declared, errors="replace"))
    return tree


def safe_official_link(value, base):
    if not value:
        return ""
    url = urljoin(base, html.unescape(value))
    p = urlparse(url)
    if p.scheme == "https" and p.hostname in ("gemeinde-wartenberg.de", "www.gemeinde-wartenberg.de"):
        return url
    return ""


def is_detail_link(link):
    return "detailansicht" in urlparse(link).path or "tx_news_pi1" in unquote(link)


def news_item_id(link):
    fields = parse_qs(urlparse(link).query)
    for key, values in fields.items():
        if key.endswith("[news]") and values and values[0].isdigit():
            return "gemeinde-offiziell-" + values[0]
    return "gemeinde-offiziell-" + hashlib.sha256(link.encode()).hexdigest()[:12]


def parse_official_news(tree, base):
    results, seen = [], set()
    for a in tree.anchors:
        link = safe_official_link(a.attrs.get("href"), base)
        if not link or not is_detail_link(link):
            continue
        title = text(a)
        if not title or title.casefold() in ("mehr erfahren", "weiterlesen", "mehr", "lesen", "nächste", "vorherige", "zurück", "weiter", "erste", "letzte") or re.fullmatch(r"\d+", title):
            continue
        if len(title) > 165 or len(title) < 4:
            continue
        container = a.parent
        context = ""
        for _ in range(6):
            if container is None:
                break
            possible = text(container)
            if len(possible) > 35 and len(possible) < 1800 and DATE.search(possible):
                context = possible
                break
            container = container.parent
        found = DATE.search(context)
        if not found:
            continue
        day, month, year = map(int, found.groups())
        try:
            date = dt.date(year, month, day)
        except ValueError:
            continue
        if date > TODAY + dt.timedelta(days=1) or date < TODAY - dt.timedelta(days=200):
            continue
        identifier = news_item_id(link)
        if identifier in seen:
            continue
        seen.add(identifier)
        excerpt = context[found.end():].strip(" *·–-")
        if excerpt.startswith(title):
            excerpt = excerpt[len(title):].strip()
        excerpt = re.split(r"\b(?:Mehr erfahren|Weiterlesen)\b", excerpt, flags=re.I)[0]
        excerpt = re.sub(r"\s+", " ", excerpt).strip(" -·*:")[:210]
        if excerpt.casefold() == title.casefold() or not excerpt:
            excerpt = ""
        from news_topics import topic_for
        topic = topic_for(title, "gemeinde", "Rathaus & Politik")
        results.append({
            "id": identifier, "title": title, "date": date.isoformat(),
            "publishedAt": date.isoformat() + "T12:00:00+02:00",
            "desc": "", "officialExcerpt": excerpt, "sourceName": "Gemeinde Wartenberg",
            "sourceId": "gemeinde", "source": link, "via": "Amtliche Website",
            "locality": "Wartenberg", "category": topic, "topic": topic,
        })
    return results


def split_organizer_and_title(parts, remainder):
    # Inspect the exact visible HTML text segments before trying to separate.
    post = [part.strip() for part in parts if part.strip()]
    # If date is a separate node, subsequent parts are typically organizer/title.
    date_idx = next((i for i, t in enumerate(post) if EVENT_DATE.search(t)), -1)
    if date_idx >= 0:
        first = post[date_idx]
        index = EVENT_DATE.search(first)
        tail = first[index.end():].strip(" -") if index else ""
        remaining = ([tail] if tail else []) + post[date_idx+1:]
        remaining = [x for x in remaining if x and not x.startswith("©")]
        if len(remaining) >= 2:
            organizer = remaining[0]
            title = " ".join(remaining[1:])
            if 2 <= len(organizer) <= 110 and 4 <= len(title) <= 210:
                return organizer, title
    return "Siehe Gemeindekalender", remainder


def guess_location(organizer, title):
    s = (organizer + " " + title).casefold()
    if "angersbach" in s or "angersbacher" in s:
        return "Angersbach"
    if "landenhausen" in s or "landenhäuser" in s:
        return "Landenhausen"
    return "Wartenberg"


def guess_category(title):
    low = title.casefold()
    if any(t in low for t in ("konzert", "liederabend", "musik", "chor")):
        return "Musik"
    if any(t in low for t in ("kirmes", "weihnachtsmarkt", "advent", "kunst", "kultur", "fest")):
        return "Kultur"
    if any(t in low for t in ("turnier", "schießen", "sport", "lauf")):
        return "Sport"
    return "Gemeinschaft"


def event_id(start, organizer, title):
    normalized = re.sub(r"[^a-z0-9]", "", (organizer + "|" + title).casefold())
    return "gemeinde-termin-" + hashlib.sha256((start + "|" + normalized).encode()).hexdigest()[:14]


def parse_official_events(tree, base):
    results, seen = [], set()
    for a in tree.anchors:
        visible = text(a)
        match = EVENT_DATE.match(visible)
        if not match:
            continue
        d, mo, end_d, end_mo, y = match.groups()
        try:
            start = dt.date(int(y), int(mo), int(d))
            finish = dt.date(int(y), int(end_mo or mo), int(end_d or d))
        except ValueError:
            continue
        if finish < TODAY - dt.timedelta(days=2) or start > TODAY + dt.timedelta(days=550):
            continue
        remainder = visible[match.end():].strip(" -·:")[:240]
        if len(remainder) < 6:
            continue
        organizer, title = split_organizer_and_title(list(segments(a)), remainder)
        if len(title) > 220 or not title:
            continue
        link = safe_official_link(a.attrs.get("href"), base) or EVENTS_URL
        key = (start.isoformat(), finish.isoformat(), re.sub(r"\W", "", visible.casefold())[:160])
        if key in seen:
            continue
        seen.add(key)
        results.append({
            "id": event_id(start.isoformat(), organizer, title),
            "start": start.isoformat(), "end": finish.isoformat(), "title": title,
            "location": guess_location(organizer, title), "category": guess_category(title),
            "organizer": organizer, "description": "", "source": link,
            "origin": "Gemeindekalender", "exactTimeKnown": False,
        })
    return results


def fetch_paged_index(url, kind, limit=6):
    queue, seen, results = [url], set(), []
    for _ in range(limit):
        if not queue:
            break
        page = queue.pop(0)
        if page in seen:
            continue
        seen.add(page)
        try:
            tree = fetch_document(page)
            rows = parse_official_news(tree, page) if kind == "news" else parse_official_events(tree, page)
            results.extend(rows)
            print("OFFICIAL", kind, len(rows), page.split("?")[0], flush=True)
            if not rows and len(seen) == 1:
                samples = [(text(a)[:135], a.attrs.get("href", "")[:120], list(segments(a))[:8])
                           for a in tree.anchors if DATE.search(text(a)) or
                           (kind == "news" and is_detail_link(a.attrs.get("href", "")))]
                print("PROBE anchors:", json.dumps(samples[:8], ensure_ascii=False), flush=True)
            for a in tree.anchors:
                link = safe_official_link(a.attrs.get("href"), page)
                if not link or link in seen or link in queue:
                    continue
                p = urlparse(link)
                if p.path != urlparse(url).path or not p.query:
                    continue
                q = unquote(p.query).casefold()
                if "currentpage" in q or "page=" in q or "paginator" in q:
                    queue.append(link)
        except (ValueError, OSError, HTTPError, URLError) as exc:
            print("OFFICIAL", kind, "failed:", type(exc).__name__, str(exc)[:110], flush=True)
        time.sleep(0.25)
    unique = {x["id"]:x for x in results}
    return list(unique.values())


def normalize_name(s):
    return re.sub(r"[^a-z0-9]", "", html.unescape(s).casefold())


def merge_events(scraped, previous):
    old = [x for x in previous.get("items", []) if isinstance(x, dict)]
    updated = []
    seen = set()
    for fresh in scraped:
        # Keep manually checked descriptions from a matching calendar entry.
        candidates = [x for x in old if x.get("start") == fresh["start"]]
        match = next((x for x in candidates if
            normalize_name(x.get("title", "")) in normalize_name(fresh["title"]) or
            normalize_name(fresh["title"]) in normalize_name(x.get("title", ""))), None)
        if not match and len(candidates) == 1:
            # Multiple written variants for the SAME official event are common
            # ("Preis-Schießen" versus "Preis- und Geflügelschießen").
            # Accept only when organizer is clearly shared, not merely the date.
            candidate = candidates[0]
            own_org = normalize_name(candidate.get("organizer", ""))
            new_org = normalize_name(fresh.get("organizer", ""))
            if len(own_org) >= 12 and len(new_org) >= 12 and (
                own_org in new_org or new_org in own_org or
                (own_org[:11] == new_org[:11] and
                 candidate.get("location") == fresh.get("location"))
            ):
                match = candidate
        if match:
            fresh["title"] = match["title"]
            if fresh["organizer"] == "Siehe Gemeindekalender":
                fresh["organizer"] = match["organizer"]
            if fresh["location"] == "Wartenberg" and match["location"] in ("Angersbach", "Landenhausen"):
                fresh["location"] = match["location"]
            fresh["description"] = match.get("description", "")
            fresh["category"] = match.get("category", fresh["category"])
            fresh["id"] = match["id"]
        key = (fresh["start"], normalize_name(fresh["title"]))
        if key not in seen:
            updated.append(fresh)
            seen.add(key)
    # Preserve past editorially verified events that have not disappeared from
    # the official feed for up to 21 days after the last manual check.
    for old_event in old:
        key = (old_event.get("start", ""), normalize_name(old_event.get("title", "")))
        if key in seen or old_event.get("end", "") < TODAY.isoformat():
            continue
        verified_date = previous.get("checkedAt", "")
        try:
            age = (TODAY - dt.date.fromisoformat(verified_date)).days
        except (TypeError, ValueError):
            age = 99
        if age <= 21:
            updated.append(old_event)
            seen.add(key)
    updated.sort(key=lambda x: (x["start"], x["title"]))
    return updated[:250]


def merge_news(scraped, previous):
    old = [x for x in previous.get("items", []) if isinstance(x, dict)]
    by_id = {x.get("id"):x for x in old if x.get("id")}
    by_url = {x.get("source"):x for x in old if x.get("source")}
    news_numbers = set()
    for older in old:
        parsed = parse_qs(urlparse(older.get("source","")).query)
        for k,v in parsed.items():
            if k.endswith("[news]") and v:
                news_numbers.add(v[0])
    for new in scraped:
        parsed = parse_qs(urlparse(new["source"]).query)
        ids = [v[0] for k,v in parsed.items() if k.endswith("[news]") and v]
        if new["source"] in by_url or (ids and ids[0] in news_numbers):
            continue
        by_id[new["id"]] = new
    return sorted(by_id.values(),
                  key=lambda x: x.get("publishedAt", x.get("date","")),
                  reverse=True)[:260]


def main(argv):
    print("Official source sync; mode =", "probe" if "--probe" in argv else "write", flush=True)
    news = fetch_paged_index(NEWS_URL, "news", limit=5)
    # Homepage features most recent official announcements even when pagination
    # on the news index points at earlier entries.
    try:
        home = fetch_document(HOME_URL)
        news.extend(parse_official_news(home, HOME_URL))
    except (ValueError, OSError, HTTPError, URLError) as exc:
        print("Homepage unavailable:", type(exc).__name__, flush=True)
    news = list({n["id"]:n for n in news}.values())
    ev = fetch_paged_index(EVENTS_URL, "events", limit=5)
    print("OFFICIAL RESULTS", json.dumps({
        "news": len(news), "events": len(ev),
        "newsExamples": [(n["date"], n["title"]) for n in news[:12]],
        "eventExamples": [(e["start"], e["organizer"], e["title"],e["source"]) for e in ev[:15]],
    }, ensure_ascii=False), flush=True)
    if "--probe" in argv:
        return 0
    if len(news) >= 3 and NEWS_FILE.exists():
        previous = json.loads(NEWS_FILE.read_text(encoding="utf-8"))
        previous["items"] = merge_news(news, previous)
        previous["localCount"] = sum(1 for x in previous["items"] if x.get("locality") == "Wartenberg")
        previous["officialCheckedAt"] = dt.datetime.now(dt.timezone.utc).isoformat()
        # Keep RSS last checked timestamp as separate provenance.
        NEWS_FILE.write_text(json.dumps(previous, ensure_ascii=False, indent=2)+"\n",encoding="utf-8")
    else:
        print("Official news unavailable; keeping existing file intact")
    if len(ev) >= 4 and EVENTS_FILE.exists():
        previous = json.loads(EVENTS_FILE.read_text(encoding="utf-8"))
        previous["items"] = merge_events(ev, previous)
        previous["checkedAt"] = TODAY.isoformat()
        previous["sourceUrl"] = EVENTS_URL
        previous["syncMode"] = "Automatischer Abgleich mit offiziellem Gemeindekalender"
        EVENTS_FILE.write_text(json.dumps(previous, ensure_ascii=False, indent=2)+"\n",encoding="utf-8")
    else:
        print("Official event feed incomplete; keeping verified event data intact")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
