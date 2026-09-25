from __future__ import annotations

from datetime import datetime
import json
import random
import shutil
from datetime import datetime, timedelta
from pathlib import Path


# ============================================================
# NPC NEWS — STATIC NEWS GENERATOR
# ============================================================

ROOT = Path(__file__).resolve().parent

DATA_DIR = ROOT / "data"
DIST_DIR = ROOT / "dist"
STATIC_DIR = ROOT / "static"

EVENTS_FILE = DATA_DIR / "events.json"


# ============================================================
# SETTINGS
# ============================================================

# Number of different versions generated for each news type.
# More variants = more possible newsroom combinations.
VARIANTS_PER_EVENT = 4

# Number of minor local stories generated for every event.
MINOR_STORIES_PER_EVENT = 24


# ============================================================
# DIRECTORIES
# ============================================================

def ensure_directories():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DIST_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD EVENTS
# ============================================================

def load_events():

    if not EVENTS_FILE.exists():
        raise FileNotFoundError(
            f"Events file not found:\n{EVENTS_FILE}"
        )

    with EVENTS_FILE.open(
        "r",
        encoding="utf-8"
    ) as f:

        events = json.load(f)

    if isinstance(events, dict):

        events = events.get(
            "events",
            []
        )

    if not isinstance(events, list):

        raise ValueError(
            "data/events.json must contain a JSON array of events."
        )

    return events


# ============================================================
# FORMAT HELPERS
# ============================================================

def number(value):

    try:
        return f"{int(value):,}"

    except (ValueError, TypeError):

        return "0"


def indian_number(value):

    try:

        value = int(value)

    except (ValueError, TypeError):

        return "0"

    sign = ""

    if value < 0:

        sign = "-"

        value = abs(value)

    text = str(value)

    if len(text) <= 3:

        return sign + text

    last_three = text[-3:]

    remaining = text[:-3]

    groups = []

    while len(remaining) > 2:

        groups.insert(
            0,
            remaining[-2:]
        )

        remaining = remaining[:-2]

    if remaining:

        groups.insert(
            0,
            remaining
        )

    return (
        sign +
        ",".join(
            groups +
            [last_three]
        )
    )


def money(value):

    try:

        return (
            "₹" +
            indian_number(value)
        )

    except (ValueError, TypeError):

        return "₹0"


def choose(items):

    if not items:
        return ""

    return random.choice(items)


def random_id():

    return (
        "NPC-" +
        "".join(
            random.choices(
                "abcdefghijklmnopqrstuvwxyz0123456789",
                k=10
            )
        )
    )


# ============================================================
# TEXT VARIATION HELPERS
# ============================================================

REPORTERS = [

    "NPC News Desk",
    "World Affairs Desk",
    "Local News Bureau",
    "Infrastructure Desk",
    "Business Desk",
    "Transport Desk",
    "Public Safety Desk",
    "Housing Desk",
    "Economic Desk",
    "Special Correspondent",
    "City Desk",
    "Night Desk",
    "Morning Desk",
    "Emergency Desk",
    "Community Desk",
]


OPENERS = [

    "Residents woke to another complicated morning",

    "The latest assessment is now coming in",

    "Authorities have begun releasing additional details",

    "Local officials are continuing their assessment",

    "The affected district is slowly returning to normal",

    "Emergency crews remain active across the area",

    "Residents are now facing the practical consequences",

    "Officials say the situation is stabilising",

    "The battle may be over, but the disruption continues",

    "A clearer picture of the aftermath is beginning to emerge",

]


NPC_REACTIONS = [

    "Residents say the biggest problem is simply getting through the day.",

    "People living nearby say normal routines remain difficult.",

    "Local residents are now dealing with the less dramatic consequences of the incident.",

    "Families and workers are trying to adapt while repairs continue.",

    "For ordinary residents, the battle has become an infrastructure problem.",

    "The immediate danger has passed, but daily life remains disrupted.",

    "Residents say they are more concerned about tomorrow morning than yesterday's battle.",

]


# ============================================================
# EVENT VALIDATION
# ============================================================

def validate_event(event):

    required = [
        "id",
        "world",
        "location",
        "characters",
        "damage",
        "consequences",
    ]

    missing = [
        field
        for field in required
        if field not in event
    ]

    if missing:

        raise ValueError(
            f"Event is missing required fields: {missing}\n"
            f"Event: {event}"
        )

    if not isinstance(
        event["characters"],
        list
    ):

        raise ValueError(
            f"characters must be a list in event {event['id']}"
        )

    if len(event["characters"]) < 2:

        raise ValueError(
            f"Event {event['id']} must contain at least "
            f"two characters."
        )


# ============================================================
# DERIVED EVENT CONTENT
# ============================================================

def build_timeline(event):

    hero = event["characters"][0]
    villain = event["characters"][1]

    location = event["location"]

    duration = event.get(
        "duration",
        "an unspecified duration"
    )

    winner = event.get(
        "winner",
        hero
    )

    return [

        {
            "time": "START",
            "title": "Incident begins",
            "text": (
                f"{hero} and {villain} are reported to have "
                f"begun their confrontation in {location}."
            ),
        },

        {
            "time": "EARLY",
            "title": "Public infrastructure enters the battle zone",
            "text": (
                f"The confrontation expands beyond the immediate "
                f"combat area as surrounding roads, buildings and "
                f"vehicles become exposed to the conflict."
            ),
        },

        {
            "time": "RESPONSE",
            "title": "Emergency response begins",
            "text": (
                f"Emergency crews begin moving into affected areas "
                f"while residents are advised to avoid the incident zone."
            ),
        },

        {
            "time": "DURING",
            "title": "Battle continues",
            "text": (
                f"The confrontation continues for approximately "
                f"{duration}, according to preliminary reports."
            ),
        },

        {
            "time": "END",
            "title": "Confrontation ends",
            "text": (
                f"{winner} is reported to have defeated {villain}. "
                f"The immediate battle ends, but emergency operations "
                f"continue across {location}."
            ),
        },

        {
            "time": "AFTERMATH",
            "title": "Residents begin dealing with the consequences",
            "text": (
                f"Cleanup crews, medical teams, transport authorities "
                f"and local officials begin assessing the damage across "
                f"{location}."
            ),
        },

    ]


def build_overview(event):

    location = event["location"]
    world = event["world"]

    hero = event["characters"][0]
    villain = event["characters"][1]

    duration = event.get(
        "duration",
        "an unspecified duration"
    )

    winner = event.get(
        "winner",
        hero
    )

    damage = event.get(
        "damage",
        {}
    )

    consequences = event.get(
        "consequences",
        {}
    )

    npc_affected = damage.get(
        "npc_affected",
        0
    )

    utilities = consequences.get(
        "utilities",
        "essential services are being inspected"
    )

    economic_loss = consequences.get(
        "economic_loss",
        0
    )

    return {

        "headline_summary": (

            f"The confrontation between "
            f"{hero} and {villain} ended after "
            f"{duration}, leaving residents of "
            f"{location} to deal with the consequences."

        ),

        "paragraphs": [

            (
                f"The incident took place in {location}, within the "
                f"{world}. The confrontation involved {hero} and "
                f"{villain} and lasted approximately {duration}."
            ),

            (
                f"{winner} was reported as the winner. Once the "
                f"combatants left the area, emergency services began "
                f"assessing damage and assisting affected residents."
            ),

            (
                f"Initial assessments indicate that approximately "
                f"{number(npc_affected)} NPCs were directly or "
                f"indirectly affected by the incident."
            ),

            (
                f"Local services reported that {utilities}."
            ),

            (
                f"Preliminary economic losses are estimated at "
                f"{money(economic_loss)}."
            ),

        ],
    }


def build_battle_report(event):

    hero = event["characters"][0]
    villain = event["characters"][1]

    winner = event.get(
        "winner",
        hero
    )

    duration = event.get(
        "duration",
        "an unspecified duration"
    )

    location = event["location"]

    return {

        "paragraphs": [

            (
                f"The confrontation involved {hero} and {villain} "
                f"in {location}."
            ),

            (
                f"According to preliminary reports, the battle "
                f"continued for approximately {duration}."
            ),

            (
                f"The confrontation affected surrounding public "
                f"infrastructure as emergency crews worked to keep "
                f"civilians away from the immediate combat zone."
            ),

            (
                f"The reported winner was {winner}."
            ),

        ]

    }


def build_aftermath(event):

    location = event["location"]

    damage = event.get(
        "damage",
        {}
    )

    consequences = event.get(
        "consequences",
        {}
    )

    displaced = damage.get(
        "displaced",
        0
    )

    injuries = damage.get(
        "injuries",
        0
    )

    missing = damage.get(
        "missing",
        0
    )

    roads = damage.get(
        "roads",
        0
    )

    buildings = damage.get(
        "buildings",
        0
    )

    transport_routes = consequences.get(
        "transport_routes",
        0
    )

    schools = consequences.get(
        "schools_closed",
        0
    )

    hospitals = consequences.get(
        "hospitals_affected",
        0
    )

    economic_loss = consequences.get(
        "economic_loss",
        0
    )

    utilities = consequences.get(
        "utilities",
        "essential services are being inspected"
    )

    return {

        "immediate": (
            f"Emergency services remain active across {location}. "
            f"Authorities are assessing {number(buildings)} damaged "
            f"buildings and {number(roads)} affected roads."
        ),

        "short_term": (
            f"{number(displaced)} residents are temporarily displaced, "
            f"while medical teams continue assessing approximately "
            f"{number(injuries)} reported injuries. "
            f"{number(missing)} people remain reported missing."
        ),

        "services": (
            f"{number(transport_routes)} transport routes, "
            f"{number(schools)} schools and "
            f"{number(hospitals)} hospitals have been affected."
        ),

        "utilities": utilities,

        "long_term": (
            f"Preliminary economic losses are estimated at "
            f"{money(economic_loss)}. Infrastructure repairs, "
            f"business recovery and civilian relocation are expected "
            f"to continue after the battle."
        ),

    }


# ============================================================
# ARTICLE CREATOR
# ============================================================

def make_article(
    event,
    category,
    headline,
    summary,
    body,
    priority="NORMAL",
    article_type="REPORT",
    published=None,
):

    return {

        "id":
            random_id(),

        "event_id":
            event["id"],

        "category":
            category,

        "type":
            article_type,

        "priority":
            priority,

        "headline":
            headline,

        "summary":
            summary,

        "body":
            body,

        "world":
            event["world"],

        "location":
            event["location"],

        "characters":
            event["characters"],

        "winner":
            event.get(
                "winner",
                event["characters"][0]
            ),

        "duration":
            event.get(
                "duration",
                "UNKNOWN"
            ),

        "damage":
            event.get(
                "damage",
                {}
            ),

        "consequences":
            event.get(
                "consequences",
                {}
            ),

        "npc_quotes":
            event.get(
                "npc_quotes",
                []
            ),

        "timeline":
            event.get(
                "timeline",
                []
            ),

        "aftermath":
            event.get(
                "aftermath",
                {}
            ),

        "battle_summary":
            event.get(
                "battle_summary",
                ""
            ),

        "published":
            published or datetime.now().isoformat(),

        "reporter":
            choose(REPORTERS),

    }


# ============================================================
# PUBLICATION TIME GENERATOR
# ============================================================

def make_publication_time(
    base_time,
    index
):

    # Spread stories across the fictional newsroom day.
    offset_minutes = (
        random.randint(
            0,
            23 * 60
        ) +
        index * random.randint(
            1,
            8
        )
    )

   published = datetime.now().isoformat()

    return published.isoformat(
        timespec="minutes"
    )


# ============================================================
# UNIQUE ARTICLE HELPER
# ============================================================

def add_article(
    articles,
    seen_headlines,
    article,
):

    headline_key =
        article["headline"].strip().lower()

    if headline_key in seen_headlines:

        return False

    seen_headlines.add(
        headline_key
    )

    articles.append(
        article
    )

    return True


# ============================================================
# GENERATE MAIN ARTICLE VARIANTS
# ============================================================

def generate_main_variants(
    event,
    variant,
    base_time
):

    articles = []

    seen = set()

    world = event["world"]
    location = event["location"]

    hero = event["characters"][0]
    villain = event["characters"][1]

    winner = event.get(
        "winner",
        hero
    )

    damage = event["damage"]
    consequences = event["consequences"]

    buildings = damage.get(
        "buildings",
        0
    )

    roads = damage.get(
        "roads",
        0
    )

    vehicles = damage.get(
        "vehicles",
        0
    )

    businesses = damage.get(
        "businesses",
        0
    )

    npc_affected = damage.get(
        "npc_affected",
        0
    )

    injuries = damage.get(
        "injuries",
        0
    )

    missing = damage.get(
        "missing",
        0
    )

    displaced = damage.get(
        "displaced",
        0
    )

    duration = event.get(
        "duration",
        "UNKNOWN"
    )

    transport_routes = consequences.get(
        "transport_routes",
        0
    )

    schools = consequences.get(
        "schools_closed",
        0
    )

    hospitals = consequences.get(
        "hospitals_affected",
        0
    )

    utilities = consequences.get(
        "utilities",
        "essential services are being inspected"
    )

    economic_loss = consequences.get(
        "economic_loss",
        0
    )

    quotes = event.get(
        "npc_quotes",
        []
    )

    quote = choose(
        quotes
        or [
            "My apartment is still standing. The street is not.",
            "The heroes left. We still have work tomorrow.",
            "Nobody asked whether our shop could survive another battle.",
            "I just want the bus to run again.",
        ]
    )


    # --------------------------------------------------------
    # BREAKING VARIANTS
    # --------------------------------------------------------

    breaking_headlines = [

        f"{hero} defeats {villain} after {duration} battle",

        f"{villain} defeated as {location} battle finally ends",

        f"{hero} wins confrontation, residents face aftermath",

        f"{location} battle ends after {duration} of destruction",

    ]


    breaking_summaries = [

        (
            f"The battle has ended, but residents of "
            f"{location} are now dealing with the consequences."
        ),

        (
            f"{winner} has emerged from the confrontation as "
            f"emergency crews move into the affected district."
        ),

        (
            f"The fighting is over. The cleanup operation is now "
            f"becoming the main story in {location}."
        ),

        (
            f"Authorities are beginning a large-scale assessment "
            f"following the confrontation."
        ),

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "BREAKING",
            breaking_headlines[
                variant %
                len(breaking_headlines)
            ],
            breaking_summaries[
                variant %
                len(breaking_summaries)
            ],
            (
                f"{location} — {choose(OPENERS)}. "
                f"The confrontation between {hero} and "
                f"{villain} lasted approximately {duration}. "
                f"{winner} was reported as the victor. "
                f"Emergency crews are now entering the affected "
                f"district while residents attempt to determine "
                f"whether homes, workplaces and normal routines "
                f"can continue."
            ),
            priority="URGENT",
            article_type="BREAKING",
            published=make_publication_time(
                base_time,
                variant
            ),
        )
    )


    # --------------------------------------------------------
    # BATTLE VARIANTS
    # --------------------------------------------------------

    battle_headlines = [

        f"{hero} vs {villain}: What happened in {location}",

        f"Inside the {duration} battle that shook {location}",

        f"How the {hero}-{villain} confrontation unfolded",

        f"Battle timeline: The confrontation that changed {location}",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "BATTLE",
            battle_headlines[
                variant %
                len(battle_headlines)
            ],
            (
                f"A timeline of the confrontation and "
                f"its immediate consequences."
            ),
            (
                f"The confrontation began in {location} and "
                f"continued for {duration}. Witnesses reported "
                f"repeated impacts across the district. The fighters "
                f"eventually left the immediate area, leaving "
                f"emergency crews to assess the damage."
            ),
            priority="HIGH",
            article_type="BATTLE REPORT",
            published=make_publication_time(
                base_time,
                variant + 10
            ),
        )
    )


    # --------------------------------------------------------
    # DAMAGE VARIANTS
    # --------------------------------------------------------

    damage_headlines = [

        f"{number(buildings)} buildings affected after battle",

        f"Structural damage assessment begins across {location}",

        f"Engineers inspect {number(buildings)} damaged buildings",

        f"Battle leaves buildings across {location} awaiting inspection",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "DAMAGE",
            damage_headlines[
                variant %
                len(damage_headlines)
            ],
            (
                f"Structural inspections have begun across "
                f"{location}."
            ),
            (
                f"Officials say at least {number(buildings)} "
                f"buildings have been damaged or otherwise affected. "
                f"Engineers are inspecting structures before residents "
                f"are allowed to return."
            ),
            priority="HIGH",
            article_type="DAMAGE REPORT",
            published=make_publication_time(
                base_time,
                variant + 20
            ),
        )
    )


    # --------------------------------------------------------
    # ROADS
    # --------------------------------------------------------

    road_headlines = [

        f"{number(roads)} roads affected following battle",

        f"Road closures spread across {location}",

        f"Engineers begin inspecting {number(roads)} damaged roads",

        f"Drivers warned away from {location} after battle damage",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "TRANSPORT",
            road_headlines[
                variant %
                len(road_headlines)
            ],
            (
                "Drivers are being warned to avoid "
                "the affected district."
            ),
            (
                f"At least {number(roads)} roads in and around "
                f"{location} are affected. Officials have placed "
                f"temporary restrictions on several routes while "
                f"engineers inspect damaged surfaces, bridges and "
                f"intersections."
            ),
            article_type="TRANSPORT",
            published=make_publication_time(
                base_time,
                variant + 30
            ),
        )
    )


    # --------------------------------------------------------
    # VEHICLES
    # --------------------------------------------------------

    vehicle_headlines = [

        f"{number(vehicles)} vehicles damaged in {location}",

        f"Residents count vehicle losses after battle",

        f"Parking areas become cleanup zones after confrontation",

        f"Vehicle damage assessment expands across {location}",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "TRANSPORT",
            vehicle_headlines[
                variant %
                len(vehicle_headlines)
            ],
            (
                "Residents are reporting widespread vehicle damage."
            ),
            (
                f"Emergency responders and residents have reported "
                f"damage to approximately {number(vehicles)} vehicles. "
                f"Some were caught in the immediate battle zone while "
                f"others were damaged by falling debris and secondary "
                f"impacts."
            ),
            article_type="LOCAL REPORT",
            published=make_publication_time(
                base_time,
                variant + 40
            ),
        )
    )


    # --------------------------------------------------------
    # PUBLIC TRANSPORT
    # --------------------------------------------------------

    transit_headlines = [

        f"{number(transport_routes)} public transport routes suspended",

        f"Transit disruption continues across {location}",

        f"Commuters face delays as {number(transport_routes)} routes close",

        f"Bus and transit services rerouted after battle",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "TRANSPORT",
            transit_headlines[
                variant %
                len(transit_headlines)
            ],
            (
                "Commuters face delays while infrastructure "
                "inspections continue."
            ),
            (
                f"Transit authorities have suspended "
                f"{number(transport_routes)} routes serving "
                f"{location}. Officials say services will resume "
                f"after roads and stations are declared safe."
            ),
            article_type="TRANSIT UPDATE",
            published=make_publication_time(
                base_time,
                variant + 50
            ),
        )
    )


    # --------------------------------------------------------
    # BUSINESS
    # --------------------------------------------------------

    business_headlines = [

        f"{number(businesses)} businesses affected by battle",

        f"Local businesses count losses after {location} confrontation",

        f"Shops and offices struggle to reopen after battle",

        f"Business district faces uncertain recovery in {location}",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "BUSINESS",
            business_headlines[
                variant %
                len(business_headlines)
            ],
            (
                "Shop owners say the fight has created another "
                "unexpected business crisis."
            ),
            (
                f"At least {number(businesses)} businesses have "
                f"reported damage, closures or severe interruptions. "
                f"Restaurants, retail stores, offices and independent "
                f"businesses are among those affected."
            ),
            article_type="BUSINESS REPORT",
            published=make_publication_time(
                base_time,
                variant + 60
            ),
        )
    )


    # --------------------------------------------------------
    # EMPLOYMENT
    # --------------------------------------------------------

    employment_headlines = [

        f"Workers struggle to reach jobs after {location} disruption",

        "Employers adjust schedules after transport shutdown",

        "Workers face another disrupted commute",

        f"Businesses ask employees to work remotely in {location}",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "EMPLOYMENT",
            employment_headlines[
                variant %
                len(employment_headlines)
            ],
            (
                "Thousands of employees face disrupted commuting."
            ),
            (
                f"Businesses say workers are having difficulty "
                f"reaching their jobs because of damaged roads and "
                f"suspended transport. Some employers have moved "
                f"temporarily to remote operations where possible."
            ),
            article_type="LABOR REPORT",
            published=make_publication_time(
                base_time,
                variant + 70
            ),
        )
    )


    # --------------------------------------------------------
    # HOUSING
    # --------------------------------------------------------

    housing_headlines = [

        f"{number(displaced)} residents temporarily displaced",

        f"Families search for temporary housing in {location}",

        "Apartment residents wait for structural inspections",

        f"Displaced residents seek shelter after {location} battle",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "HOUSING",
            housing_headlines[
                variant %
                len(housing_headlines)
            ],
            (
                "Families are looking for temporary accommodation "
                "after the battle."
            ),
            (
                f"Approximately {number(displaced)} residents have "
                f"been temporarily displaced. Local shelters, relatives "
                f"and nearby hotels are being used while structural "
                f"inspections continue."
            ),
            article_type="HOUSING REPORT",
            published=make_publication_time(
                base_time,
                variant + 80
            ),
        )
    )


    # --------------------------------------------------------
    # EDUCATION
    # --------------------------------------------------------

    education_headlines = [

        f"{number(schools)} schools affected by battle aftermath",

        f"Classes disrupted across {location}",

        f"Schools remain closed while damage is assessed",

        f"Teachers and students face uncertain return date",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "EDUCATION",
            education_headlines[
                variant %
                len(education_headlines)
            ],
            (
                "Students and teachers face disrupted schedules."
            ),
            (
                f"{number(schools)} schools in the wider {location} "
                f"area have suspended classes or changed schedules. "
                f"Officials say the decision is intended to keep "
                f"students away from damaged infrastructure."
            ),
            article_type="EDUCATION",
            published=make_publication_time(
                base_time,
                variant + 90
            ),
        )
    )


    # --------------------------------------------------------
    # HEALTH
    # --------------------------------------------------------

    health_headlines = [

        f"{number(hospitals)} hospitals affected by emergency response",

        f"Medical facilities activate emergency procedures",

        f"Hospitals prepare for continued post-battle demand",

        f"Emergency medical network stretched across {location}",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "HEALTH",
            health_headlines[
                variant %
                len(health_headlines)
            ],
            (
                "Medical facilities activate emergency procedures."
            ),
            (
                f"{number(hospitals)} medical facilities have "
                f"activated emergency procedures following the "
                f"incident. Hospitals are treating injuries while "
                f"attempting to maintain normal care for patients "
                f"already receiving treatment."
            ),
            article_type="HEALTH REPORT",
            published=make_publication_time(
                base_time,
                variant + 100
            ),
        )
    )


    # --------------------------------------------------------
    # INJURIES
    # --------------------------------------------------------

    injury_headlines = [

        f"{number(injuries)} injuries reported after {location} battle",

        f"Medical teams assess {number(injuries)} reported injuries",

        "Hospitals continue treating battle-related injuries",

        f"Injury count rises as hospitals complete assessments",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "HEALTH",
            injury_headlines[
                variant %
                len(injury_headlines)
            ],
            (
                "Medical teams continue to assess residents "
                "and responders."
            ),
            (
                f"Officials have reported approximately "
                f"{number(injuries)} injuries associated with "
                f"the incident. The figure may change as hospitals "
                f"complete their assessments."
            ),
            priority="HIGH",
            article_type="CASUALTY UPDATE",
            published=make_publication_time(
                base_time,
                variant + 110
            ),
        )
    )


    # --------------------------------------------------------
    # MISSING PERSONS
    # --------------------------------------------------------

    missing_headlines = [

        f"{number(missing)} people reported missing after battle",

        f"Families await news of {number(missing)} missing people",

        f"Search teams continue looking for missing residents",

        f"Missing-person search expands across {location}",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "PUBLIC SAFETY",
            missing_headlines[
                variant %
                len(missing_headlines)
            ],
            (
                "Families are waiting for information as "
                "search teams enter damaged areas."
            ),
            (
                f"Authorities say {number(missing)} people have "
                f"been reported missing. Search and rescue teams "
                f"are checking damaged buildings and surrounding areas."
            ),
            priority="HIGH",
            article_type="PUBLIC SAFETY",
            published=make_publication_time(
                base_time,
                variant + 120
            ),
        )
    )


    # --------------------------------------------------------
    # UTILITIES
    # --------------------------------------------------------

    utility_headlines = [

        f"Utility services disrupted across parts of {location}",

        f"Utility crews inspect damaged infrastructure",

        f"Residents warned of continued service interruptions",

        f"Power and water systems undergo emergency inspections",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "UTILITIES",
            utility_headlines[
                variant %
                len(utility_headlines)
            ],
            utilities,
            (
                f"Utility crews are inspecting infrastructure after "
                f"the battle. {utilities.capitalize()}. Residents "
                f"are being advised to prepare for temporary "
                f"interruptions."
            ),
            article_type="UTILITY UPDATE",
            published=make_publication_time(
                base_time,
                variant + 130
            ),
        )
    )


    # --------------------------------------------------------
    # NPC LIFE
    # --------------------------------------------------------

    npc_headlines = [

        f"Food deliveries delayed across {location}",

        f"Residents adjust daily routines after battle",

        f"Everyday life remains disrupted across {location}",

        f"Local families adapt to post-battle restrictions",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "NPC LIFE",
            npc_headlines[
                variant %
                len(npc_headlines)
            ],
            (
                "Ordinary residents are dealing with "
                "the practical aftermath."
            ),
            (
                f"{choose(NPC_REACTIONS)} "
                f"Damage to roads and transport infrastructure "
                f"is delaying normal activities across {location}. "
                f"Restaurants, grocery stores and families are "
                f"adjusting their routines."
            ),
            article_type="DAILY LIFE",
            published=make_publication_time(
                base_time,
                variant + 140
            ),
        )
    )


    # --------------------------------------------------------
    # ECONOMY
    # --------------------------------------------------------

    economy_headlines = [

        f"Battle damage could cost {money(economic_loss)}",

        f"Economic losses from {location} battle reach {money(economic_loss)}",

        f"Officials begin calculating {money(economic_loss)} recovery bill",

        f"Business disruption adds to {money(economic_loss)} damage estimate",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "ECONOMY",
            economy_headlines[
                variant %
                len(economy_headlines)
            ],
            (
                "Local officials begin calculating the "
                "financial consequences."
            ),
            (
                f"Preliminary estimates place the economic impact "
                f"at around {money(economic_loss)}. The estimate "
                f"includes infrastructure, business interruption, "
                f"vehicle damage and emergency response."
            ),
            priority="HIGH",
            article_type="ECONOMIC REPORT",
            published=make_publication_time(
                base_time,
                variant + 150
            ),
        )
    )


    # --------------------------------------------------------
    # INSURANCE
    # --------------------------------------------------------

    insurance_headlines = [

        f"Insurance offices prepare for surge in {location} claims",

        "Property owners begin documenting battle damage",

        "Insurers prepare for wave of vehicle and property claims",

        f"Residents ask insurers how to report battle damage",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "ECONOMY",
            insurance_headlines[
                variant %
                len(insurance_headlines)
            ],
            (
                "Property owners begin documenting "
                "battle-related damage."
            ),
            (
                f"Insurance companies are preparing for a large "
                f"number of property and vehicle claims. Residents "
                f"are being advised to document visible damage and "
                f"retain repair records."
            ),
            article_type="INSURANCE",
            published=make_publication_time(
                base_time,
                variant + 160
            ),
        )
    )


    # --------------------------------------------------------
    # GOVERNMENT
    # --------------------------------------------------------

    government_headlines = [

        f"Officials announce emergency response for {location}",

        f"Authorities establish recovery operation in {location}",

        "Government teams begin coordinating post-battle repairs",

        f"Emergency restrictions announced across {location}",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "GOVERNMENT",
            government_headlines[
                variant %
                len(government_headlines)
            ],
            (
                "Authorities establish temporary measures "
                "following the battle."
            ),
            (
                f"Local authorities have established an emergency "
                f"response operation covering transportation, housing, "
                f"public safety and infrastructure. Officials say "
                f"repairs will begin once damaged areas are declared safe."
            ),
            article_type="GOVERNMENT",
            published=make_publication_time(
                base_time,
                variant + 170
            ),
        )
    )


    # --------------------------------------------------------
    # NPC INTERVIEW
    # --------------------------------------------------------

    interview_headlines = [

        "Residents ask a simple question: Who pays for all this?",

        f"Inside {location}: Residents describe life after the battle",

        "The heroes left. The residents stayed.",

        "What the battle looks like from street level",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "NPC LIFE",
            interview_headlines[
                variant %
                len(interview_headlines)
            ],
            (
                "Ordinary residents describe life after "
                "another superpowered confrontation."
            ),
            (
                f"Residents of {location} say the aftermath is "
                f"becoming as important as the battle itself. "
                f"One resident told NPC News: \"{quote}\""
            ),
            article_type="NPC INTERVIEW",
            published=make_publication_time(
                base_time,
                variant + 180
            ),
        )
    )


    # --------------------------------------------------------
    # SOCIAL
    # --------------------------------------------------------

    social_headlines = [

        f"Social media fills with reactions to {location} battle",

        f"Residents post photos and complaints after battle",

        f"{location} becomes centre of online discussion",

        "Videos, photographs and complaints flood social networks",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "SOCIAL",
            social_headlines[
                variant %
                len(social_headlines)
            ],
            (
                "Residents share photographs, complaints "
                "and survival stories online."
            ),
            (
                f"Social media platforms have filled with posts "
                f"from residents of {location}. Posts range from "
                f"videos of the confrontation to complaints about "
                f"traffic, housing, electricity and business closures."
            ),
            article_type="SOCIAL MEDIA",
            published=make_publication_time(
                base_time,
                variant + 190
            ),
        )
    )


    # --------------------------------------------------------
    # EMERGENCY SERVICES
    # --------------------------------------------------------

    emergency_headlines = [

        f"Emergency crews remain deployed across {location}",

        f"Rescue teams continue operations after battle",

        f"Firefighters and rescue crews work through damaged district",

        "Emergency services enter second phase of response",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "PUBLIC SAFETY",
            emergency_headlines[
                variant %
                len(emergency_headlines)
            ],
            (
                "Firefighters, rescue teams and utility workers "
                "continue operations."
            ),
            (
                f"Emergency crews remain active throughout the "
                f"affected area. Teams are checking buildings, "
                f"clearing debris and assisting residents who "
                f"cannot safely return home."
            ),
            article_type="EMERGENCY SERVICES",
            published=make_publication_time(
                base_time,
                variant + 200
            ),
        )
    )


    # --------------------------------------------------------
    # ENVIRONMENT
    # --------------------------------------------------------

    environment_headlines = [

        f"Battle leaves environmental damage across {location}",

        f"Environmental teams inspect aftermath in {location}",

        "Officials check air and water systems after confrontation",

        f"Cleanup teams assess environmental impact of battle",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "ENVIRONMENT",
            environment_headlines[
                variant %
                len(environment_headlines)
            ],
            (
                "Officials inspect air, water and surrounding "
                "infrastructure."
            ),
            (
                f"Environmental teams are inspecting the area for "
                f"dust, chemical leaks, damaged water systems and "
                f"other secondary effects associated with the "
                f"confrontation."
            ),
            article_type="ENVIRONMENT",
            published=make_publication_time(
                base_time,
                variant + 210
            ),
        )
    )


    # --------------------------------------------------------
    # RECONSTRUCTION
    # --------------------------------------------------------

    reconstruction_headlines = [

        f"Reconstruction begins as {location} counts its losses",

        f"Repair crews begin rebuilding damaged areas",

        f"{location} enters first phase of reconstruction",

        "Crews begin restoring roads, buildings and utilities",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "RECONSTRUCTION",
            reconstruction_headlines[
                variant %
                len(reconstruction_headlines)
            ],
            (
                "Repair crews begin the long process "
                "of restoring normal life."
            ),
            (
                f"Repair crews are beginning preliminary work across "
                f"{location}. The first priorities include roads, "
                f"utilities, emergency facilities and buildings "
                f"considered critical to daily life."
            ),
            article_type="RECONSTRUCTION",
            published=make_publication_time(
                base_time,
                variant + 220
            ),
        )
    )


    # --------------------------------------------------------
    # LONG TERM
    # --------------------------------------------------------

    long_term_headlines = [

        f"What happens to {location} after the heroes leave?",

        f"How long will {location} take to recover?",

        "The battle lasted minutes. The recovery may take months.",

        f"The long road back for residents of {location}",

    ]


    add_article(
        articles,
        seen,
        make_article(
            event,
            "ANALYSIS",
            long_term_headlines[
                variant %
                len(long_term_headlines)
            ],
            (
                "The battle may have lasted minutes. "
                "The recovery could take months."
            ),
            (
                f"The confrontation itself lasted {duration}, "
                f"but the effects will likely remain much longer. "
                f"Residents now face repairs, transport problems, "
                f"temporary displacement and economic disruption."
            ),
            article_type="LONG-TERM REPORT",
            published=make_publication_time(
                base_time,
                variant + 230
            ),
        )
    )


    return articles


# ============================================================
# MINOR LOCAL NEWS
# ============================================================

def generate_minor_stories(
    event,
    base_time
):

    location = event["location"]

    minor_templates = [

        (
            "LOCAL",
            f"Coffee shop reopens with limited menu in {location}",
            "A local café has reopened despite continuing infrastructure problems.",
            "Coffee service has resumed, although deliveries remain limited."
        ),

        (
            "LOCAL",
            f"Residents form neighborhood cleanup group in {location}",
            "Volunteers have begun clearing smaller debris from residential streets.",
            "Residents say they decided to organise rather than wait for every cleanup crew to arrive."
        ),

        (
            "LOCAL",
            "Taxi drivers create temporary route around damaged roads",
            "Local drivers are using alternative roads to keep residents moving.",
            "Drivers say the temporary route is slower but currently more reliable."
        ),

        (
            "LOCAL",
            "Apartment residents return after structural inspection",
            "Some residents have been allowed to return to inspected buildings.",
            "Families are returning gradually as engineers clear individual buildings."
        ),

        (
            "LOCAL",
            "Local supermarket reports unusually high demand",
            "Residents are stocking essential supplies while transport remains disrupted.",
            "Store workers say basic household items are moving faster than usual."
        ),

        (
            "LOCAL",
            "Street vendors relocate during reconstruction",
            "Small vendors have moved to nearby streets while repairs continue.",
            "Several vendors say they are trying to remain close to their regular customers."
        ),

        (
            "LOCAL",
            "Office workers told to work remotely",
            "Several employers have temporarily changed working arrangements.",
            "Companies say remote work will continue while transport problems remain."
        ),

        (
            "LOCAL",
            "Residents complain about debris collection delays",
            "Cleanup crews are working through multiple damaged areas.",
            "Residents say some smaller streets are still waiting for cleanup teams."
        ),

        (
            "COMMUNITY",
            f"Residents organise food-sharing network in {location}",
            "Neighbours are helping families affected by temporary disruption.",
            "Community groups are collecting meals and essential supplies."
        ),

        (
            "COMMUNITY",
            "Local residents open temporary charging station",
            "A neighbourhood group has created a small charging point for residents.",
            "The service is intended for people dealing with utility interruptions."
        ),

        (
            "COMMUNITY",
            "Volunteers begin checking on elderly residents",
            "Community volunteers are visiting residents who may need assistance.",
            "The effort focuses on people living alone or without transport."
        ),

        (
            "LOCAL",
            "Corner bakery changes opening hours after battle",
            "A neighbourhood bakery has adjusted its schedule because of deliveries.",
            "The owner says the shop will remain open as long as supplies arrive."
        ),

        (
            "TRANSPORT",
            f"Morning traffic remains slow around {location}",
            "Commuters report delays on alternative routes.",
            "Drivers are using side roads while major routes remain under inspection."
        ),

        (
            "TRANSPORT",
            "Ride-share prices fluctuate as routes change",
            "Passengers report changing travel times across the affected district.",
            "Drivers say route restrictions are making journeys longer."
        ),

        (
            "HOUSING",
            "Residents compare temporary accommodation options",
            "Displaced families are looking for affordable places to stay.",
            "Local accommodation providers say demand has increased."
        ),

        (
            "HOUSING",
            "Landlords begin checking buildings after battle",
            "Property owners are arranging inspections before reopening damaged units.",
            "Residents are waiting for clearance before returning."
        ),

        (
            "BUSINESS",
            "Small businesses create shared delivery network",
            "Local shop owners are cooperating to keep deliveries moving.",
            "Businesses say cooperation is helping them operate despite transport problems."
        ),

        (
            "BUSINESS",
            "Restaurant owners switch to smaller menus",
            "Some restaurants are reducing menu choices because supplies are difficult to obtain.",
            "Owners say the changes should be temporary."
        ),

        (
            "BUSINESS",
            "Repair shops report sudden increase in customers",
            "Vehicle and property repair businesses are seeing unusual demand.",
            "Some repair shops are extending operating hours."
        ),

        (
            "HEALTH",
            "Local clinics extend operating hours",
            "Medical staff are adjusting schedules following the incident.",
            "Clinics say extended hours are intended to reduce pressure on larger hospitals."
        ),

        (
            "HEALTH",
            "Pharmacies report increased demand for basic supplies",
            "Local pharmacies are seeing more residents than usual.",
            "Some stores are arranging additional deliveries."
        ),

        (
            "UTILITIES",
            "Utility workers inspect residential connections",
            "Crews continue checking damaged local infrastructure.",
            "Residents are being asked to report visible problems."
        ),

        (
            "EDUCATION",
            "Teachers prepare temporary lessons for affected students",
            "Schools are adapting while normal schedules remain disrupted.",
            "Teachers are sharing assignments through temporary arrangements."
        ),

        (
            "SOCIAL",
            "Residents create online map of damaged streets",
            "A community project is helping residents identify difficult routes.",
            "The map is being updated as roads reopen."
        ),

        (
            "LOCAL",
            "Local hardware stores run short of repair supplies",
            "Residents and repair crews are buying essential materials.",
            "Store owners say deliveries are being reordered as quickly as possible."
        ),

        (
            "LOCAL",
            "Neighbourhood restaurants offer reduced-price meals",
            "Some businesses are offering cheaper meals to affected residents.",
            "Owners say the programme will continue while supplies permit."
        ),

        (
            "COMMUNITY",
            "Residents set up temporary information desk",
            "Volunteers are helping people find information about services and routes.",
            "The desk is operating near a busy public area."
        ),

        (
            "LOCAL",
            "Cleanup crews discover more minor damage",
            "Workers are finding additional small-scale damage during cleanup.",
            "Officials say the overall assessment remains ongoing."
        ),

    ]


    random.shuffle(
        minor_templates
    )


    articles = []

    selected =
        minor_templates[
            :min(
                MINOR_STORIES_PER_EVENT,
                len(minor_templates)
            )
        ]


    for index, item in enumerate(
        selected
    ):

        category, headline, summary, extra =
            item

        body = (

            f"Residents in {location} are adjusting to "
            f"another consequence of the confrontation. "
            f"{extra} {choose(NPC_REACTIONS)}"
        )


        articles.append(

            make_article(

                event,

                category,

                headline,

                summary,

                body,

                article_type="MINOR NEWS",

                published=make_publication_time(
                    base_time,
                    300 + index
                ),

            )
        )


    return articles


# ============================================================
# GENERATE ALL ARTICLES FOR EVENT
# ============================================================

def generate_articles(
    event,
    base_time
):

    articles = []

    /*
    This generator intentionally creates several different
    versions of the same news categories. The underlying event
    remains identical, while the newsroom has more headlines
    to choose from.
    */

    for variant in range(
        VARIANTS_PER_EVENT
    ):

        articles.extend(
            generate_main_variants(
                event,
                variant,
                base_time
            )
        )


    articles.extend(
        generate_minor_stories(
            event,
            base_time
        )
    )


    return articles


# ============================================================
# PREPARE EVENT
# ============================================================

def prepare_event(event):

    event = dict(event)

    event["timeline"] =
        build_timeline(event)

    event["overview"] =
        build_overview(event)

    event["battle_report"] =
        build_battle_report(event)

    event["aftermath"] =
        build_aftermath(event)

    battle_paragraphs =
        event["battle_report"].get(
            "paragraphs",
            []
        )

    event["battle_summary"] =
        " ".join(
            battle_paragraphs
        )

    return event


# ============================================================
# DEDUPLICATE ARTICLES
# ============================================================

def deduplicate_articles(
    articles
):

    seen_ids = set()

    seen_headlines = set()

    result = []


    for article in articles:

        article_id =
            article.get(
                "id"
            )

        headline =
            str(
                article.get(
                    "headline",
                    ""
                )
            ).strip().lower()


        if not article_id:
            continue


        if article_id in seen_ids:
            continue


        if headline in seen_headlines:
            continue


        seen_ids.add(
            article_id
        )

        seen_headlines.add(
            headline
        )

        result.append(
            article
        )


    return result


# ============================================================
# MAIN GENERATOR
# ============================================================

def generate():

    ensure_directories()

    events =
        load_events()


    prepared_events = []

    all_articles = []


    # --------------------------------------------------------
    # PREPARE EVENTS
    # --------------------------------------------------------

    for event in events:

        validate_event(
            event
        )

        prepared_event =
            prepare_event(
                event
            )

        prepared_events.append(
            prepared_event
        )


    # --------------------------------------------------------
    # BASE NEWSROOM TIME
    # --------------------------------------------------------

    now =
        datetime.now()


    # --------------------------------------------------------
    # GENERATE ARTICLES
    # --------------------------------------------------------

    for event_index, event in enumerate(
        prepared_events
    ):

        event_base_time =
            now - timedelta(
                minutes=random.randint(
                    0,
                    180
                )
            )


        articles =
            generate_articles(
                event,
                event_base_time
            )


        all_articles.extend(
            articles
        )


    # --------------------------------------------------------
    # REMOVE DUPLICATES
    # --------------------------------------------------------

    all_articles =
        deduplicate_articles(
            all_articles
        )


    # --------------------------------------------------------
    # RANDOMISE NEWSROOM
    # --------------------------------------------------------

    random.shuffle(
        all_articles
    )


    # --------------------------------------------------------
    # CALCULATE NPC TOTAL
    # --------------------------------------------------------

    total_npc_affected = sum(

        int(
            event
            .get(
                "damage",
                {}
            )
            .get(
                "npc_affected",
                0
            )
        )

        for event in prepared_events

    )


    # --------------------------------------------------------
    # BUILD OUTPUT
    # --------------------------------------------------------

    output = {

        "site": {

            "name":
                "NPC NEWS",

            "tagline":
                "THE HEROES WIN. THE NPCs LIVE WITH IT.",

            "description":
                "FICTIONAL WORLD NEWS NETWORK",

            "generated_at":
                datetime.now().isoformat(),

            "article_count":
                len(all_articles),

            "event_count":
                len(prepared_events),

            "npc_affected":
                total_npc_affected,

            "generation_mode":
                "ROTATING FICTIONAL NEWSROOM",

        },


        # ----------------------------------------------------
        # COMPLETE INCIDENT DATA
        # ----------------------------------------------------

        "events":
            prepared_events,


        # ----------------------------------------------------
        # ALL NEWS ARTICLES
        # ----------------------------------------------------

        "articles":
            all_articles,

    }


    # --------------------------------------------------------
    # WRITE NEWS.JSON
    # --------------------------------------------------------

    output_file =
        DIST_DIR / "news.json"


    with output_file.open(
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            output,
            f,
            indent=2,
            ensure_ascii=False
        )


    # --------------------------------------------------------
    # COPY STATIC FILES
    # --------------------------------------------------------

    for filename in [

        "index.html",
        "styles.css",
        "app.js",

    ]:

        source =
            STATIC_DIR / filename

        destination =
            DIST_DIR / filename


        if source.exists():

            shutil.copy2(
                source,
                destination
            )

            print(
                f"Copied: {filename}"
            )

        else:

            print(
                f"WARNING: Missing static file: {filename}"
            )


    # --------------------------------------------------------
    # REPORT
    # --------------------------------------------------------

    print()

    print(
        "=" * 70
    )

    print(
        "NPC NEWS GENERATOR"
    )

    print(
        "=" * 70
    )

    print(
        f"Events generated : {len(prepared_events)}"
    )

    print(
        f"Articles created : {len(all_articles)}"
    )

    print(
        f"NPCs affected    : {indian_number(total_npc_affected)}"
    )

    print(
        f"Output directory : {DIST_DIR}"
    )

    print(
        f"News file        : {output_file}"
    )

    print(
        "=" * 70
    )

    print()

    print(
        "SUCCESS: NPC NEWS newsroom generated."
    )

    print(
        "Complete event data included."
    )

    print(
        "Articles contain full incident references."
    )

    print(
        "Multiple headline variants generated."
    )

    print(
        "Minor local news generated."
    )

    print(
        "Indian currency formatting enabled."
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    generate()
