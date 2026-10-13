"""Discovery via Google Places API (New). Requires GOOGLE_PLACES_API_KEY.

Billing note: phone/website/rating fields bill at the Enterprise SKU.
Set a budget cap in Google Cloud before running big sweeps.
"""
import json
import os
import time
import urllib.request

from .classify import web_status
from .score import score

URL = "https://places.googleapis.com/v1/places:searchText"
FIELDS = ",".join(
    "places." + f for f in (
        "id", "displayName", "formattedAddress", "nationalPhoneNumber",
        "websiteUri", "rating", "userRatingCount", "priceLevel",
        "businessStatus", "primaryType",
    )
) + ",nextPageToken"

CITIES = [
    "San Francisco", "Oakland", "Berkeley", "Alameda", "San Leandro", "Hayward",
    "Fremont", "Walnut Creek", "Concord", "Richmond", "Daly City", "San Mateo",
    "Redwood City", "Palo Alto", "Mountain View", "Sunnyvale", "Santa Clara",
    "San Jose", "Milpitas", "San Rafael", "Santa Rosa", "Pleasanton", "Livermore",
]
CATEGORIES = [
    "plumber", "electrician", "general contractor", "roofing contractor",
    "HVAC contractor", "painter", "landscaper", "house cleaning service",
    "moving company", "auto repair shop", "locksmith", "pest control",
    "flooring contractor", "handyman", "chiropractor", "accountant",
]


def _post(body, key):
    req = urllib.request.Request(
        URL, data=json.dumps(body).encode(), method="POST",
        headers={"Content-Type": "application/json",
                 "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def search(category, city, key, max_pages=3):
    token = None
    for _ in range(max_pages):
        body = {"textQuery": f"{category} in {city}, CA", "pageSize": 20}
        if token:
            body["pageToken"] = token
        data = _post(body, key)
        yield from data.get("places", [])
        token = data.get("nextPageToken")
        if not token:
            return
        time.sleep(0.5)


def to_lead(p, city):
    lead = {
        "place_id": p["id"],
        "name": p.get("displayName", {}).get("text", ""),
        "address": p.get("formattedAddress"),
        "city": city,
        "category": p.get("primaryType"),
        "phone": p.get("nationalPhoneNumber"),
        "website": p.get("websiteUri"),
        "web_status": web_status(p.get("websiteUri")),
        "rating": p.get("rating"),
        "reviews": p.get("userRatingCount"),
        "price_level": p.get("priceLevel"),
    }
    lead["score"] = score(lead)
    return lead


def run(conn, cities=None, categories=None, min_reviews=5):
    key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not key:
        raise SystemExit("Set GOOGLE_PLACES_API_KEY")
    added = 0
    for city in cities or CITIES:
        for cat in categories or CATEGORIES:
            for p in search(cat, city, key):
                if p.get("businessStatus") != "OPERATIONAL":
                    continue
                lead = to_lead(p, city)
                if lead["web_status"] == "real" or (lead["reviews"] or 0) < min_reviews:
                    continue
                cur = conn.execute(
                    "INSERT OR IGNORE INTO leads (place_id,name,address,city,category,phone,"
                    "website,web_status,rating,reviews,price_level,score,status) VALUES "
                    "(:place_id,:name,:address,:city,:category,:phone,:website,:web_status,"
                    ":rating,:reviews,:price_level,:score,'needs_enrichment')", lead)
                added += cur.rowcount
            conn.commit()
            print(f"{city} / {cat}: total new so far {added}", flush=True)
    return added
