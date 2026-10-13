from leadgen.classify import is_personal_email, web_status
from leadgen.enrich import looks_like_person
from leadgen.score import score


def test_web_status():
    assert web_status(None) == "none"
    assert web_status("https://www.facebook.com/joesplumbing") == "social_only"
    assert web_status("https://joesplumbing.com") == "real"
    assert web_status("https://notfacebook.com") == "real"


def test_emails():
    assert not is_personal_email("info@joes.com")
    assert not is_personal_email("Support@joes.com")
    assert not is_personal_email("front.desk@joes.com")
    assert not is_personal_email("garbage")
    assert is_personal_email("joe.martinez@gmail.com")


def test_person():
    assert looks_like_person("Joe Martinez")
    assert not looks_like_person("Planet Builders Inc")
    assert not looks_like_person("Joes Plumbing LLC")


def test_score_real_site_is_zero():
    base = dict(web_status="real", reviews=100, rating=5, category="plumber", price_level=None, phone="x")
    assert score(base) == 0
    assert score({**base, "web_status": "none"}) > score({**base, "web_status": "social_only"}) > 0
