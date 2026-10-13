# Handymanqotes / leadgen

Finds Bay Area businesses with no real website, ranks them by likely ability to pay, and tracks decision-maker contact data.

```
export GOOGLE_PLACES_API_KEY=...
python -m leadgen.cli discover --city Oakland --category plumber   # no flags = full sweep (costs money)
python -m leadgen.cli enrich                                       # SF owner names, promote complete leads
python -m leadgen.cli import-contacts contacts.csv                 # place_id,owner_name,email,ext,source
python -m leadgen.cli export --status ready > ready.csv
```

A lead becomes `ready` only with a person-shaped owner name, a phone, and a non-generic email.

## Limits
- Score is a proxy (reviews, rating, trade, price level), not proof of a $500-1000 budget.
- Owner names are automated for San Francisco only (DataSF registry). Registry owner is often an LLC; those stay unpromoted.
- Direct email/extension are not discoverable for businesses with no domain. Import from a paid source or research manually.
- Phone numbers are the listed business line; direct lines and extensions are not verifiable here.
- Cold calls/texts: check the National DNC registry and TCPA rules before dialing; no autodialers or texts. Cold email needs CAN-SPAM compliance (opt-out, physical address).
