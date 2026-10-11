#!/usr/bin/env python3
"""Free, non-publishing Wartenberg 360 AI pilot.

Fetch up to 20 real, publicly available news pages (honour robots.txt and
access restrictions), summarize temporarily using a locally running small
GGUF model on GitHub Actions, then save ONLY the pilot verdicts and original
article links. Never commits source texts, generated public news or secrets.
"""
from __future__ import annotations

import datetime as dt
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser
from urllib.error import HTTPError, URLError

try:
    import trafilatura
except ImportError:
    raise SystemExit("Run pip install trafilatura first.")

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "news.json"
OUTPUT = ROOT / "data" / "ai_pilot_report.json"
USER_AGENT = "Wartenberg360-Pilot/1.0 (+https://github.com/Segi91/wartenberg-360)"
ALLOWED = {
    "gemeinde-wartenberg.de", "lauterbacher-anzeiger.de",
    "oberhessen-live.de", "lifepr.de", "vogelsbergkreis.de",
}
MIN_TEXT = 430
MAX_ARTICLES = 20
FETCH_BUDGET = 65
API = "http://127.0.0.1:8089/v1/chat/completions"
robots_cache: dict[str, RobotFileParser | None] = {}


def allowed_host(host: str) -> bool:
    return any(host == h or host.endswith("." + h) for h in ALLOWED)


def article_url(url: str) -> bool:
    try:
        u = urlparse(url)
        return u.scheme == "https" and allowed_host(u.hostname or "") and not u.username and not u.password
    except ValueError:
        return False


def robots_allow(url: str) -> bool:
    host = urlparse(url).netloc
    if host not in robots_cache:
        robots = RobotFileParser()
        robots.set_url("https://" + host + "/robots.txt")
        try:
            robots.read()
            robots_cache[host] = robots
        except (OSError, ValueError, HTTPError, URLError) as exc:
            print("Robots not accessible for", host, type(exc).__name__)
            robots_cache[host] = None
    robots = robots_cache[host]
    return robots is not None and robots.can_fetch(USER_AGENT, url)


def source_text(url: str) -> tuple[str, str]:
    if not article_url(url):
        return "", "unapproved_domain"
    if not robots_allow(url):
        return "", "robots_disallow_or_unknown"
    req = Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9",
    })
    try:
        with urlopen(req, timeout=16) as response:
            effective = response.geturl()
            if not article_url(effective):
                return "", "redirect_outside_allowed"
            mime = response.headers.get("Content-Type", "")
            if not mime.lower().startswith(("text/html", "application/xhtml+xml")):
                return "", "not_html"
            raw = response.read(1_100_001)
            if len(raw) > 1_100_000:
                return "", "page_too_large"
        extracted = trafilatura.extract(raw, include_comments=False, include_tables=False,
                                        favor_precision=True) or ""
        extracted = re.sub(r"\s+", " ", extracted).strip()
        if len(extracted) < MIN_TEXT:
            return "", "insufficient_public_article_text"
        if any(t in extracted.casefold() for t in (
            "abonnieren sie jetzt, um diesen artikel", "melden sie sich an, um weiterzulesen",
        )) and len(extracted) < 950:
            return "", "paywall_teaser"
        return extracted[:4700], "ok"
    except (OSError, ValueError, HTTPError, URLError) as exc:
        return "", "request_" + type(exc).__name__


def candidate_articles(items: list[dict]) -> list[dict]:
    """Prioritize Wartenberg; preserve non-sport diversity and add regional pilots."""
    curated = [x for x in items if x.get("editorial") and x.get("locality") == "Wartenberg"]
    fresh_local = [x for x in items if x.get("locality") == "Wartenberg" and not x.get("editorial")]
    regional = [x for x in items if x.get("locality") != "Wartenberg"]
    priority = {"gemeinde": 0, "la": 1, "oberhessen": 2, "kreis": 3}
    curated.sort(key=lambda x: (priority.get(x.get("sourceId"), 9), x.get("date", "")))
    fresh_local.sort(key=lambda x: (x.get("topic") == "Sport", x.get("sourceId") != "la", x.get("date", "")))
    regional.sort(key=lambda x: (priority.get(x.get("sourceId"), 9), x.get("date", "")))
    result, seen = [], set()
    # Mix Wartenberg articles with different publishers to measure accessibility.
    groups = [(curated, 18), (fresh_local, 20), (regional, 25)]
    for group, limit in groups:
        for item in group[:limit]:
            url = item.get("source", "")
            if url not in seen and article_url(url):
                result.append(item)
                seen.add(url)
    return result[:FETCH_BUDGET]


def generate(title: str, text: str) -> tuple[str, str, float]:
    prompt = (
        "Fasse den folgenden öffentlich zugänglichen deutschsprachigen Nachrichtenartikel "
        "neutral und sachlich in genau zwei oder drei eigenen Sätzen zusammen. "
        "Nenne nur Informationen, die eindeutig im Quelltext belegt sind. "
        "Erfinde keine Zahlen, Namen, Zitate oder Termine. "
        "Schreibe weder Werbung noch eine Einleitung und kopiere keine längeren Passagen. "
        "Antworte ausschließlich auf Deutsch und ohne Stichpunkte. /no_think\n\n"
        + "Überschrift: " + title[:220] + "\n\nArtikeltext:\n" + text
    )
    payload = {
        "model": "local",
        "messages": [
            {"role": "system", "content": "Du erstellst überprüfbare kurze deutsche Nachrichten-Zusammenfassungen. /no_think"},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1, "max_tokens": 210, "stream": False,
        "chat_template_kwargs": {"enable_thinking": False},
    }
    started = time.monotonic()
    try:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        req = Request(API, data=data, method="POST", headers={"Content-Type": "application/json"})
        with urlopen(req, timeout=135) as response:
            result = json.loads(response.read(200_000))
        content = result["choices"][0]["message"]["content"].strip()
        # Qwen 0.6B may still generate thinking tokens: never publish them.
        if "<think>" in content:
            content = re.sub(r"<think>.*?</think>", "", content, flags=re.S).strip()
        if any(marker in content for marker in ("<think>", "</think>", "<|")):
            return "", "thinking_leak", time.monotonic() - started
        return content.strip(), "ok", time.monotonic() - started
    except Exception as exc:
        return "", "model_" + type(exc).__name__, time.monotonic() - started


def quality(title: str, source: str, summary: str) -> tuple[bool, list[str]]:
    problems = []
    if not (85 <= len(summary) <= 620):
        problems.append("length")
    if not (2 <= len(re.findall(r"[.!?](?:\s|$)", summary)) <= 4):
        problems.append("sentence_count")
    if any(v in summary.casefold() for v in (
        "als ki", "ich kann nicht", "quelltext", "als sprachmodell", "artikeltext",
        "<think>", "kein zugriff", "leider", "hier ist",
    )):
        problems.append("meta_text")
    # Reject numerical details that appear nowhere in the actual public text.
    source_nums = set(re.findall(r"\b\d+[\d.,]*\b", source + " " + title))
    generated_nums = set(re.findall(r"\b\d+[\d.,]*\b", summary))
    if not generated_nums.issubset(source_nums):
        problems.append("new_numbers:" + ",".join(sorted(generated_nums-source_nums)[:5]))
    # Avoid lifting sizeable pieces of copyrighted wording verbatim.
    raw = re.sub(r"\s+", " ", source.casefold())
    for sequence in re.findall(r"\S+(?:\s+\S+){13}", summary.casefold()):
        if sequence in raw:
            problems.append("long_literal_copy")
            break
    return not problems, problems


def main():
    items = json.loads(INPUT.read_text(encoding="utf-8"))["items"]
    candidates = candidate_articles(items)
    print("Pilot: candidate article URLs:", len(candidates), "target:", MAX_ARTICLES, flush=True)
    prepared, outcomes, failures = [], [], []
    for article in candidates:
        if len(prepared) >= MAX_ARTICLES:
            break
        text, status = source_text(article["source"])
        if status != "ok":
            failures.append({
                "title": article.get("title", ""), "publisher": article.get("sourceName", ""),
                "status": status
            })
        else:
            prepared.append((article, text))
            print("SOURCE", len(prepared), article.get("sourceId"), len(text),
                  article.get("title", "")[:90], flush=True)
        time.sleep(0.45)
    if not prepared:
        raise SystemExit("Pilot failed: no legitimate public source texts found.")
    print("PILOT source accessibility:", len(prepared), "of", len(candidates),
          "denied/thin:", len(failures), flush=True)
    for i, (article, text) in enumerate(prepared, 1):
        summary, model_state, duration = generate(article.get("title", ""), text)
        approved, problems = quality(article.get("title", ""), text, summary) if model_state == "ok" else (False, [model_state])
        outcome = {
            "id": article.get("id"), "sourceId": article.get("sourceId"),
            "sourceName": article.get("sourceName"),
            "title": article.get("title"), "source": article.get("source"),
            "local": article.get("locality") == "Wartenberg",
            "sourceChars": len(text), "seconds": round(duration, 1),
            "draft": summary[:700] if summary else "",
            "passesMechanicalChecks": approved,
            "reasons": problems,
            "reviewStatus": "NEEDS_HUMAN_FACT_CHECK",
        }
        outcomes.append(outcome)
        print(f"PILOT {i}/{len(prepared)} {'MECHANICALLY_OK' if approved else 'REJECTED'}"
              f" | {duration:.1f}s | {article.get('sourceId')} | {article.get('title', '')[:70]}",
              flush=True)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    result = {
        "runAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "model": "Qwen3-0.6B-Q4_K_M, llama.cpp CPU",
        "type": "non_publishing_pilot",
        "goal": MAX_ARTICLES,
        "foundSourceTexts": len(prepared),
        "passedMechanicalChecks": sum(1 for x in outcomes if x["passesMechanicalChecks"]),
        "manualFactCheckingRequired": True,
        "notSuitableForAutomaticPublishing": True,
        "notes": "No source texts or images stored; only fact-check candidates. Mechanical checks do not establish accuracy.",
        "unavailable": failures[:40],
        "results": outcomes,
    }
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("PILOT RESULTS", len(outcomes), "drafts;",
          result["passedMechanicalChecks"], "passed structural checks.", flush=True)
    print("NOT PUBLISHED: human evaluation required.", flush=True)


if __name__ == "__main__":
    main()
