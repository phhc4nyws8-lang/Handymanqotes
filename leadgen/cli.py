import argparse
import csv
import sys

from . import db, discover, enrich


def main(argv=None):
    ap = argparse.ArgumentParser(prog="leadgen")
    sub = ap.add_subparsers(dest="cmd", required=True)

    d = sub.add_parser("discover", help="find website-less businesses via Google Places")
    d.add_argument("--city", action="append")
    d.add_argument("--category", action="append")
    d.add_argument("--min-reviews", type=int, default=5)

    sub.add_parser("enrich", help="look up owner names (SF registry), then promote complete leads")

    i = sub.add_parser("import-contacts", help="load owner/email/ext from CSV")
    i.add_argument("path")

    e = sub.add_parser("export", help="dump leads to CSV")
    e.add_argument("--status", default="ready")
    e.add_argument("--limit", type=int, default=100)

    sub.add_parser("stats")

    a = ap.parse_args(argv)
    conn = db.connect()

    if a.cmd == "discover":
        print("added", discover.run(conn, a.city, a.category, a.min_reviews))
    elif a.cmd == "enrich":
        print("owners found", enrich.enrich_owners(conn))
        print("promoted to ready", enrich.promote_ready(conn))
    elif a.cmd == "import-contacts":
        ok, bad = enrich.import_contacts(conn, a.path)
        print(f"updated {ok}, rejected {bad}")
        print("promoted to ready", enrich.promote_ready(conn))
    elif a.cmd == "export":
        rows = conn.execute(
            "SELECT name,owner_name,phone,ext,email,city,category,reviews,rating,score,web_status,place_id "
            "FROM leads WHERE status=? ORDER BY score DESC LIMIT ?", (a.status, a.limit)).fetchall()
        w = csv.writer(sys.stdout)
        w.writerow(rows[0].keys() if rows else [])
        w.writerows(tuple(r) for r in rows)
    elif a.cmd == "stats":
        for r in conn.execute("SELECT status, COUNT(*) c FROM leads GROUP BY status"):
            print(r["status"], r["c"])


if __name__ == "__main__":
    main()
