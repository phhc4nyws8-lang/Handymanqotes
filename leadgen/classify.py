"""Website classification and email sanity checks."""
import re
from urllib.parse import urlparse

# A Facebook/Yelp page is not a website. These count as "no real website".
SOCIAL_HOSTS = (
    "facebook.com", "fb.com", "instagram.com", "yelp.com", "linktr.ee",
    "linktree.com", "twitter.com", "x.com", "tiktok.com", "nextdoor.com",
    "angi.com", "homeadvisor.com", "thumbtack.com", "yellowpages.com",
    "business.site", "square.site", "godaddysites.com", "google.com",
)

GENERIC_LOCALPARTS = {
    "info", "support", "contact", "sales", "admin", "office", "hello", "hi",
    "help", "service", "services", "team", "mail", "enquiries", "inquiries",
    "billing", "booking", "bookings", "reservations", "orders", "noreply",
    "no-reply", "webmaster", "marketing", "hr", "jobs", "careers", "press",
    "customerservice", "frontdesk", "reception", "appointments",
}

EMAIL_RE = re.compile(r"^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$")


def web_status(website):
    """none | social_only | real"""
    if not website:
        return "none"
    host = (urlparse(website if "//" in website else "//" + website).hostname or "").lower()
    host = host.removeprefix("www.")
    if any(host == h or host.endswith("." + h) for h in SOCIAL_HOSTS):
        return "social_only"
    return "real"


def is_personal_email(email):
    """Reject role/generic mailboxes. Cannot prove deliverability."""
    email = (email or "").strip().lower()
    if not EMAIL_RE.match(email):
        return False
    local = email.split("@")[0]
    return local.replace(".", "").replace("-", "").replace("_", "") not in {
        g.replace("-", "") for g in GENERIC_LOCALPARTS
    }
