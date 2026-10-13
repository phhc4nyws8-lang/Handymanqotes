"""Ability-to-pay proxy. Public data cannot confirm budget; this ranks, not proves."""

# Higher-ticket, owner-operated trades/services that routinely spend $500-1000 on marketing.
HIGH_VALUE = {
    "plumber", "electrician", "general_contractor", "roofing_contractor",
    "hvac_contractor", "painter", "landscaper", "moving_company", "dentist",
    "lawyer", "accountant", "real_estate_agency", "insurance_agency",
    "car_repair", "auto_body_shop", "locksmith", "pest_control_service",
    "house_cleaning_service", "chiropractor", "physiotherapist", "veterinary_care",
    "contractor", "flooring_contractor", "tile_contractor", "handyman",
}
PRICE_PTS = {
    "PRICE_LEVEL_INEXPENSIVE": 4, "PRICE_LEVEL_MODERATE": 8,
    "PRICE_LEVEL_EXPENSIVE": 10, "PRICE_LEVEL_VERY_EXPENSIVE": 10,
}


def score(lead):
    s = 0
    if lead["web_status"] == "none":
        s += 30
    elif lead["web_status"] == "social_only":
        s += 22
    else:
        return 0
    reviews = lead["reviews"] or 0
    s += min(reviews, 100) * 0.30           # traction = real customers = revenue
    if (lead["rating"] or 0) >= 4.3:
        s += 10
    elif (lead["rating"] or 0) >= 4.0:
        s += 5
    if lead["category"] in HIGH_VALUE:
        s += 20
    s += PRICE_PTS.get(lead["price_level"], 0)
    if not lead["phone"]:
        s -= 15
    return max(0, min(100, round(s)))
