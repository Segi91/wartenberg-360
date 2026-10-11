"""Deterministische Themenordnung fuer Wartenberg 360.

Keine KI-Zuordnung, kein Artikelvolltext, nur Ueberschriften und Metadaten.
"""
import re

TOPICS = (
    "Rathaus & Politik",
    "Kultur & Musik",
    "Gemeinschaft & Ehrenamt",
    "Familie & Soziales",
    "Natur & Umwelt",
    "Verkehr & Bauen",
    "Blaulicht",
    "Sport",
    "Vogelsberg",
)
LOCAL_TERMS = ("wartenberg", "angersbach", "landenhausen", "landenhäuser", "landenhaueser")
SPORT_CLUBS = ("sg landenhausen", "tv angersbach", "jsg wartenberg", "fsg wartenberg")
SPORT_WORDS = (
    "fußball", "fussball", "tischtennis", "tennis", "sportler",
    "spielfest", "spieltag", "derby", "liga", "tabellen", "spielbericht",
    "gegentreffer", "gegentore", "freistoß", "heimpleite", "auswärtsspiel",
    "saisonsieg", "saisonstart", "trainerwechsel", "trainer güldner",
    "punktspiel", "torjäger", "startelf",
)

def is_local(title):
    lower = str(title).casefold()
    return any(t in lower for t in LOCAL_TERMS) or any(t in lower for t in SPORT_CLUBS)

def topic_for(title, source_id="", fallback=""):
    """Themes are exclusive; 'Vereine' must never silently mean sports."""
    t = str(title or "").casefold()
    if source_id == "polizei" or any(k in t for k in (
        "feuerwehreinsatz", "flächenbrand", "flaechenbrand",
        "stoppelacker in flammen", "brandbekämpfung", "brand in ",
        "polizei", "einbruch", "unfall mit", "rettungskräfte",
    )):
        return "Blaulicht"
    if any(k in t for k in SPORT_CLUBS) or any(k in t for k in SPORT_WORDS):
        return "Sport"
    if any(k in t for k in (
        "kunst", "kultur", "musik", "blasmusik", "musikverein",
        "chor", "gesangverein", "männergesang", "maennergesang",
        "konzert", "sänger", "saenger", "lesung", "florinale",
        "kunstspaziergang", "bundesmusikfest", "liederabend",
    )):
        return "Kultur & Musik"
    if any(k in t for k in (
        "förderverein", "foerderverein", "fördergemeinschaft",
        "foerdergemeinschaft", "ehrenamt", "flohmarkt", "dorf-gespräch",
        "dorfgespräch", "dorfgemeinschaft", "schützenverein", "schuetzenverein",
        "kirmes", "landfrauen", "vereinsfest", "vereinsjubiläum",
        "vereinsjubil", "vdk ", "bürgerbündnis", "buergerbuendnis",
        "jubiläum", "jubiläum", "verein gegründet", "verein gegruendet",
    )):
        return "Gemeinschaft & Ehrenamt"
    if any(k in t for k in (
        "pfarr", "kirch", "kita", "kindergarten", "grundschule",
        "familie", "jugend", "senior", "pflege", "schwimmkurs",
        "wassergewöhnung", "freibad", "schwimmbad", "windeln",
        "ferienbetreuung", "sozial", "inklusion",
    )):
        return "Familie & Soziales"
    if any(k in t for k in (
        "herbst", "laub", "wald", "umwelt", "naturschutz", "grünabfall",
        "grünabfall", "natur", "regenwasser", "obst- und gartenbau",
        "gartenbauverein", "streuobst", "abfall", "recycling",
    )):
        return "Natur & Umwelt"
    if any(k in t for k in (
        "verkehr", "sperrung", "baustelle", "ortsumgehung", "straße",
        "strasse", "brücke", "bruecke", "bauarbeiten", "bauprojekt",
        "turnhalle", "sporthalle", "kl äranlage", "kläranlage", "klaeranlage",
        "kanal", "sanierung", "radweg",
    )):
        return "Verkehr & Bauen"
    if any(k in t for k in (
        "rathaus", "bürgermeister", "buergermeister", "bürgerver",
        "buergerver", "gemeindevertret", "gemeinderat", "haushalt",
        "investition", "wahl", "amtlich", "gemeinde informiert",
        "manöver", "manoev", "bundeswehr", "grundsteuer",
        "gemeindekasse", "informationsbroschüre",
    )) or source_id == "gemeinde":
        return "Rathaus & Politik"
    if fallback in TOPICS:
        return fallback
    if fallback == "Blaulicht":
        return "Blaulicht"
    if fallback == "Vereine":
        return "Gemeinschaft & Ehrenamt"
    if fallback == "Verkehr":
        return "Verkehr & Bauen"
    return "Vogelsberg"

def rank_score(article):
    title = str(article.get("title") or "")
    topic = article.get("topic") or topic_for(title, article.get("sourceId", ""), article.get("category", ""))
    local = article.get("locality") == "Wartenberg"
    score = 100 if local else 0
    if article.get("sourceId") == "gemeinde":
        score += 22
    if article.get("editorial"):
        score += 8
    if topic == "Sport":
        score -= 4
    return score

def normalize(article):
    a = dict(article)
    t = topic_for(a.get("title",""), a.get("sourceId",""), a.get("topic") or a.get("category") or "")
    # Preserve human-verified topic labels from the curated file.
    if a.get("editorial") and a.get("topic") in TOPICS:
        t = a["topic"]
    a["topic"] = t
    a["category"] = t
    if a.get("sourceId") == "la":
        a["locality"] = "Wartenberg" if is_local(a.get("title")) or a.get("editorial") else "Vogelsberg"
    elif a.get("sourceId") == "gemeinde":
        a["locality"] = "Wartenberg"
    return a
