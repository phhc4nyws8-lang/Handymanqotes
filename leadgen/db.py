import sqlite3
from pathlib import Path

DB_PATH = Path("leads.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS leads (
    place_id     TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    address      TEXT,
    city         TEXT,
    category     TEXT,
    phone        TEXT,
    website      TEXT,
    web_status   TEXT,           -- none | social_only | real
    rating       REAL,
    reviews      INTEGER,
    price_level  TEXT,
    score        INTEGER DEFAULT 0,
    owner_name   TEXT,
    owner_source TEXT,
    ext          TEXT,
    email        TEXT,
    email_source TEXT,
    status       TEXT DEFAULT 'new',  -- new | needs_enrichment | ready | contacted | dead
    notes        TEXT,
    created_at   TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_leads_status_score ON leads(status, score DESC);
"""


def connect(path=None):
    conn = sqlite3.connect(path or DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn
