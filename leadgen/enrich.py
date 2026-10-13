"""Decision-maker enrichment.

What is automatable for free: owner/entity name from city business-registry
open data (San Francisco only for now). What is NOT: direct email and
extension for a business with no website -- there is no domain to run
email-finder tools against. Those come in via `import-contacts` from a paid
source (Apollo, Lusha, etc.) or from your own manual research.
"""
import csv
import json
import re
import urllib.parse
import urllib.request

from .classify import is_personal_email

SF_URL = "https://data.sfgov.org/resource/g8m3-pdis.json"
ENTITY_WORDS = re.compile(r"\b(inc|llc|corp|corporation|co|company|ltd|lp|llp|partners|group|enterprises?)\b\.?", re.I)


def _norm(s):
    return re.sub(r"[^A-Z0-9 ]", "", (s or "").upper()).strip()


def looks_like_person(name):
    """Registry ownership_name is often an LLC; that is not a decision-maker."""
    return bool(name) and not ENTITY_WORDS.search(name) and len(name.split()) in (2, 3)


def lookup_sf_owner(name):
    """Prefix-query the registry, then match on punctuation-stripped names locally."""
    n = _norm(name)
    if not n:
        return None
    prefix = n.split()[0].replace("'", "''")
    where = f"upper(dba_name) like '{prefix}%' AND dba_end_date IS NULL"
    q = urllib.parse.urlencode({"$where": where, "$limit": 500})
    with urllib.request.urlopen(f"{SF_URL}?{q}", timeout=30) as r:
        rows = json.load(r)
    for row in rows:
        if _norm(row.get("dba_name")) == n and row.get("ownership_name"):
            return row["ownership_name"]
    return None


def enrich_owners(conn):
    rows = conn.execute(
        "SELECT place_id,name FROM leads WHERE city='San Francisco' AND owner_name IS NULL"
    ).fetchall()
    hits = 0
    for r in rows:
        owner = lookup_sf_owner(r["name"])
        if owner:
            conn.execute(
                "UPDATE leads SET owner_name=?, owner_source='sf_registry' WHERE place_id=?",
                (owner, r["place_id"]))
            hits += 1
    conn.commit()
    return hits


def import_contacts(conn, path):
    """CSV columns: place_id, owner_name, email, ext, source. Blank cells are ignored."""
    ok = rejected = 0
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            email = (row.get("email") or "").strip().lower()
            if email and not is_personal_email(email):
                rejected += 1
                print(f"rejected generic/invalid email: {email}")
                email = ""
            conn.execute(
                "UPDATE leads SET owner_name=COALESCE(NULLIF(?,''),owner_name),"
                "email=COALESCE(NULLIF(?,''),email), ext=COALESCE(NULLIF(?,''),ext),"
                "email_source=COALESCE(NULLIF(?,''),email_source) WHERE place_id=?",
                (row.get("owner_name"), email, row.get("ext"), row.get("source"), row["place_id"]))
            ok += 1
    conn.commit()
    return ok, rejected


def promote_ready(conn):
    """Ready = person name + phone + non-generic email. Everything else stays in the queue."""
    rows = conn.execute("SELECT * FROM leads WHERE status='needs_enrichment'").fetchall()
    n = 0
    for r in rows:
        if looks_like_person(r["owner_name"]) and r["phone"] and is_personal_email(r["email"]):
            conn.execute("UPDATE leads SET status='ready' WHERE place_id=?", (r["place_id"],))
            n += 1
    conn.commit()
    return n
