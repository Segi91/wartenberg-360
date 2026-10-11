#!/usr/bin/env python3
"""One-time, responsibly rate-limited public-address geocoding for Wartenberg 360.

Run ONLY manually/on changes to this script or its workflow. Never as part of
the two-hour news job or from end-user browsers. Public Nominatim policy:
https://operations.osmfoundation.org/policies/nominatim/
Single worker, 1.5s between all requests, persistent cache committed to git.
No vague centroid fallback. Unknown places remain without map marker.
"""
from __future__ import annotations
import datetime as dt
import json
import re
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
VENUES=ROOT/"data/places.json"
GEO=ROOT/"data/place_coordinates.json"
BASE="https://nominatim.openstreetmap.org/search"
UA="Wartenberg360-LocalMap/1.0 (+https://github.com/Segi91/wartenberg-360)"
REFERER="https://segi91.github.io/wartenberg-360/"
BOX=(9.39, 50.67, 9.56, 50.56)  # west north east south
LIMIT=100
SPACING=1.5
last_request=0.0

def load():
    places=json.loads(VENUES.read_text(encoding="utf-8"))["items"]
    geo=json.loads(GEO.read_text(encoding="utf-8"))
    return places,geo

def valid_latlon(lat,lon):
    return 50.575 < lat < 50.665 and 9.395 < lon < 9.550

def street_address(value):
    # Remove street slashes (8/10) only for retry, not as an exact house.
    first=(value or "").split(",")[0].strip()
    return first

def housenumber(addr):
    first=street_address(addr)
    number=re.search(r"\b(\d+[a-zA-Z]?(?:/\d+)?)\s*$",first)
    return number.group(1).casefold() if number else None

def geocode(q):
    global last_request
    delta=time.monotonic()-last_request
    if delta < SPACING:
        time.sleep(SPACING-delta)
    params={
        "q":q,"format":"jsonv2","addressdetails":"1",
        "limit":"3","countrycodes":"de","bounded":"1",
        "viewbox":",".join(map(str,BOX)),
        "accept-language":"de"
    }
    uri=BASE+"?"+urlencode(params)
    req=Request(uri,headers={
        "User-Agent":UA,
        "Referer":REFERER,
        "Accept":"application/json",
        "Accept-Language":"de-DE,de;q=0.9",
    })
    last_request=time.monotonic()
    with urlopen(req,timeout=16) as r:
        return json.loads(r.read(80_000))

def confidence(place, hit):
    lat=float(hit["lat"]);lon=float(hit["lon"])
    if not valid_latlon(lat,lon):
        return None
    label=str(hit.get("display_name",""))
    if "Wartenberg" not in label and not any(x in label for x in ("Angersbach","Landenhausen")):
        return None
    a=hit.get("address") or {}
    code=str(a.get("postcode") or "")
    if code and code!="36367":
        return None
    # Distinguish building addresses from midpoint street geocoding.
    expected=housenumber(place["address"])
    observed=str(a.get("house_number") or "").strip().casefold()
    road=str(a.get("road") or "")
    requested_road=street_address(place["address"])
    if expected:
        if observed:
            if expected != observed:
                return None
            precision="house"
        else:
            precision="street"  # explicitly approximate on map
    else:
        precision="street"  # generic street / crossroad
    return {
        "lat":round(lat,6),"lon":round(lon,6),
        "precision":precision,
        "label":label[:200],
        "source":"https://www.openstreetmap.org/copyright",
        "osm_type":str(hit.get("osm_type") or "")[:20],
        "osm_id":hit.get("osm_id"),
    }

def main():
    places,obj=load()
    coords=obj.setdefault("byId",{})
    loc_by_address={}
    for item in places:
        existing=coords.get(item["id"])
        if existing and valid_latlon(float(existing["lat"]),float(existing["lon"])) and item.get("address"):
            loc_by_address[item["address"]]=existing
    totals={"already":0,"resolved":0,"notFound":0,"noAddress":0,"providerBlocked":0}
    queries=0
    for item in places:
        key=item["id"]
        if key in coords:
            totals["already"]+=1
            continue
        address=item.get("address")
        if not address:
            totals["noAddress"]+=1
            continue
        if address in loc_by_address:
            coords[key]=dict(loc_by_address[address])
            totals["resolved"]+=1
            print("REUSE",key,item["title"],flush=True)
            continue
        if queries>=LIMIT:
            break
        # Exact address first; do not invent house coordinates on fallback.
        actual=address+", Hessen, Deutschland"
        queries+=1
        try:
            hits=geocode(actual)
        except HTTPError as ex:
            print("ERROR",key,ex.code,flush=True)
            if ex.code in (403,429):
                totals["providerBlocked"]+=1
                break  # Respect provider denial; do not keep retrying.
            totals["notFound"]+=1
            continue
        except (OSError,URLError,ValueError) as ex:
            print("ERROR",key,type(ex).__name__,flush=True)
            totals["notFound"]+=1
            continue
        matched=None
        for hit in hits:
            try:
                matched=confidence(item,hit)
            except (TypeError,ValueError,KeyError):
                matched=None
            if matched:
                break
        if matched:
            coords[key]=matched
            loc_by_address[address]=matched
            totals["resolved"]+=1
            print("FOUND",key,matched["precision"],item["title"],flush=True)
        else:
            totals["notFound"]+=1
            print("UNLOCATED",key,item["title"],flush=True)
    obj["generatedAt"]=dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    obj["geocoder"]="Einmalige adressbasierte Standortauflösung mit OpenStreetMap Nominatim (2026-10), ohne wiederkehrende API-Aufrufe."
    obj["license"]="OpenStreetMap-Mitwirkende (ODbL): https://www.openstreetmap.org/copyright"
    obj["missingIds"]=[p["id"] for p in places if p["id"] not in coords]
    obj["count"]=len(coords)
    obj["summary"]=totals
    GEO.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("RESULT",json.dumps({"count":len(coords),"total":len(places),"statistics":totals},ensure_ascii=False),flush=True)
    # A failure to geocode should not publish false pins.
    if totals["providerBlocked"]:
        print("Geocoder blocked request; respecting policy. Existing coordinates retained.")

if __name__=="__main__":
    main()
