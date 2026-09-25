from __future__ import annotations

import json
import random
import shutil
from datetime import datetime
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


def money(value):
    try:
        return f"₹{int(value):,}"
    except (ValueError, TypeError):
        return "₹0"


def choose(items):
    return random.choice(items)


def random_id():
    return f"NPC-{random.randint(100000, 999999)}"


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

    if not isinstance(event["characters"], list):
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

    damage = event.get("damage", {})
    consequences = event.get("consequences", {})

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
            f"The confrontation between {hero} and {villain} "
            f"ended after {duration}, leaving residents of "
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

    damage = event.get("damage", {})
    consequences = event.get("consequences", {})

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
):
    return {
        "id": random_id(),

        "event_id": event["id"],

        "category": category,

        "type": article_type,

        "priority": priority,

        "headline": headline,

        "summary": summary,

        "body": body,

        "world": event["world"],

        "location": event["location"],

        "characters": event["characters"],

        "winner": event.get(
            "winner",
            event["characters"][0]
        ),

        "duration": event.get(
            "duration",
            "UNKNOWN"
        ),

        "published": datetime.now().strftime(
            "%Y-%m-%d %H:%M"
        ),

        "reporter": choose([
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
        ]),
    }


# ============================================================
# ARTICLE GENERATION
# ============================================================

def generate_articles(event):

    articles = []

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

    # ========================================================
    # 1 BREAKING
    # ========================================================

    articles.append(
        make_article(
            event,
            "BREAKING",
            f"{hero} defeats {villain} after {duration} battle",
            (
                f"The battle in {location} has ended, "
                f"but residents are now dealing with the aftermath."
            ),
            (
                f"{location} — The confrontation between {hero} "
                f"and {villain} has ended after approximately "
                f"{duration}. {winner} has been declared the victor. "
                f"Emergency crews are now entering the affected area "
                f"while residents attempt to determine whether their "
                f"homes, workplaces and normal routines can continue."
            ),
            priority="URGENT",
            article_type="BREAKING",
        )
    )

    # ========================================================
    # 2 BATTLE
    # ========================================================

    articles.append(
        make_article(
            event,
            "BATTLE",
            f"{hero} vs {villain}: What happened in {location}",
            "A timeline of the confrontation and its immediate consequences.",
            (
                f"The confrontation began in {location} and continued "
                f"for {duration}. Witnesses reported repeated impacts "
                f"across the district. The fighters eventually left "
                f"the immediate area, leaving emergency crews to "
                f"assess the damage."
            ),
            priority="HIGH",
            article_type="BATTLE REPORT",
        )
    )

    # ========================================================
    # 3 DAMAGE
    # ========================================================

    articles.append(
        make_article(
            event,
            "DAMAGE",
            f"{number(buildings)} buildings affected after {hero}-{villain} battle",
            f"Structural inspections have begun across {location}.",
            (
                f"Officials say at least {number(buildings)} buildings "
                f"have been damaged or otherwise affected. Engineers "
                f"are inspecting structures before residents are allowed "
                f"to return."
            ),
            priority="HIGH",
            article_type="DAMAGE REPORT",
        )
    )

    # ========================================================
    # 4 ROADS
    # ========================================================

    articles.append(
        make_article(
            event,
            "TRANSPORT",
            f"{number(roads)} roads affected following battle",
            "Drivers are being warned to avoid the affected district.",
            (
                f"At least {number(roads)} roads in and around "
                f"{location} are affected. Officials have placed "
                f"temporary restrictions on several routes while "
                f"engineers inspect damaged surfaces, bridges and "
                f"intersections."
            ),
            article_type="TRANSPORT",
        )
    )

    # ========================================================
    # 5 VEHICLES
    # ========================================================

    articles.append(
        make_article(
            event,
            "TRANSPORT",
            f"{number(vehicles)} vehicles damaged in {location}",
            "Residents are reporting widespread vehicle damage.",
            (
                f"Emergency responders and residents have reported "
                f"damage to approximately {number(vehicles)} vehicles. "
                f"Some were caught in the immediate battle zone while "
                f"others were damaged by falling debris and secondary "
                f"impacts."
            ),
            article_type="LOCAL REPORT",
        )
    )

    # ========================================================
    # 6 PUBLIC TRANSPORT
    # ========================================================

    articles.append(
        make_article(
            event,
            "TRANSPORT",
            f"{number(transport_routes)} public transport routes suspended",
            "Commuters face delays while infrastructure inspections continue.",
            (
                f"Transit authorities have suspended "
                f"{number(transport_routes)} routes serving {location}. "
                f"Officials say services will resume after roads and "
                f"stations are declared safe."
            ),
            article_type="TRANSIT UPDATE",
        )
    )

    # ========================================================
    # 7 BUSINESS
    # ========================================================

    articles.append(
        make_article(
            event,
            "BUSINESS",
            f"{number(businesses)} businesses affected by battle",
            "Shop owners say the fight has created another unexpected business crisis.",
            (
                f"At least {number(businesses)} businesses have reported "
                f"damage, closures or severe interruptions. Restaurants, "
                f"retail stores, offices and independent businesses are "
                f"among those affected."
            ),
            article_type="BUSINESS REPORT",
        )
    )

    # ========================================================
    # 8 EMPLOYMENT
    # ========================================================

    articles.append(
        make_article(
            event,
            "EMPLOYMENT",
            f"Workers struggle to reach jobs after {location} disruption",
            "Thousands of employees face another day of disrupted commuting.",
            (
                f"Businesses say workers are having difficulty reaching "
                f"their jobs because of damaged roads and suspended "
                f"transport. Some employers have moved temporarily to "
                f"remote operations where possible."
            ),
            article_type="LABOR REPORT",
        )
    )

    # ========================================================
    # 9 HOUSING
    # ========================================================

    articles.append(
        make_article(
            event,
            "HOUSING",
            f"{number(displaced)} residents temporarily displaced",
            "Families are looking for temporary accommodation after the battle.",
            (
                f"Approximately {number(displaced)} residents have been "
                f"temporarily displaced. Local shelters, relatives and "
                f"nearby hotels are being used while structural inspections "
                f"continue."
            ),
            article_type="HOUSING REPORT",
        )
    )

    # ========================================================
    # 10 EDUCATION
    # ========================================================

    articles.append(
        make_article(
            event,
            "EDUCATION",
            f"{number(schools)} schools affected by the battle aftermath",
            "Students and teachers face disrupted schedules.",
            (
                f"{number(schools)} schools in the wider {location} area "
                f"have suspended classes or changed schedules. Officials "
                f"say the decision is intended to keep students away from "
                f"damaged infrastructure."
            ),
            article_type="EDUCATION",
        )
    )

    # ========================================================
    # 11 HEALTH
    # ========================================================

    articles.append(
        make_article(
            event,
            "HEALTH",
            f"{number(hospitals)} hospitals affected by emergency response",
            "Medical facilities activate emergency procedures.",
            (
                f"{number(hospitals)} medical facilities have activated "
                f"emergency procedures following the incident. Hospitals "
                f"are treating injuries while attempting to maintain "
                f"normal care for patients already receiving treatment."
            ),
            article_type="HEALTH REPORT",
        )
    )

    # ========================================================
    # 12 INJURIES
    # ========================================================

    articles.append(
        make_article(
            event,
            "HEALTH",
            f"{number(injuries)} injuries reported after {location} battle",
            "Medical teams continue to assess residents and responders.",
            (
                f"Officials have reported approximately "
                f"{number(injuries)} injuries associated with the "
                f"incident. The figure may change as hospitals "
                f"complete their assessments."
            ),
            priority="HIGH",
            article_type="CASUALTY UPDATE",
        )
    )

    # ========================================================
    # 13 MISSING
    # ========================================================

    articles.append(
        make_article(
            event,
            "PUBLIC SAFETY",
            f"{number(missing)} people reported missing after battle",
            "Families are waiting for information as search teams enter damaged areas.",
            (
                f"Authorities say {number(missing)} people have been "
                f"reported missing. Search and rescue teams are checking "
                f"damaged buildings and surrounding areas."
            ),
            priority="HIGH",
            article_type="PUBLIC SAFETY",
        )
    )

    # ========================================================
    # 14 UTILITIES
    # ========================================================

    articles.append(
        make_article(
            event,
            "UTILITIES",
            f"Utility services disrupted across parts of {location}",
            utilities,
            (
                f"Utility crews are inspecting infrastructure after "
                f"the battle. {utilities.capitalize()}. Residents are "
                f"being advised to prepare for temporary interruptions."
            ),
            article_type="UTILITY UPDATE",
        )
    )

    # ========================================================
    # 15 NPC LIFE
    # ========================================================

    articles.append(
        make_article(
            event,
            "NPC LIFE",
            f"Food deliveries delayed across {location}",
            "Restaurants and grocery stores report supply problems.",
            (
                f"Damage to roads and transport infrastructure is "
                f"delaying food deliveries across {location}. "
                f"Restaurants are reporting late shipments while "
                f"grocery stores are checking alternative supply routes."
            ),
            article_type="DAILY LIFE",
        )
    )

    # ========================================================
    # 16 ECONOMY
    # ========================================================

    articles.append(
        make_article(
            event,
            "ECONOMY",
            f"Battle damage could cost {money(economic_loss)}",
            "Local officials begin calculating the financial consequences.",
            (
                f"Preliminary estimates place the economic impact at "
                f"around {money(economic_loss)}. The estimate includes "
                f"infrastructure, business interruption, vehicle damage "
                f"and emergency response."
            ),
            priority="HIGH",
            article_type="ECONOMIC REPORT",
        )
    )

    # ========================================================
    # 17 INSURANCE
    # ========================================================

    articles.append(
        make_article(
            event,
            "ECONOMY",
            f"Insurance offices prepare for surge in {location} claims",
            "Property owners begin documenting battle-related damage.",
            (
                f"Insurance companies are preparing for a large number "
                f"of property and vehicle claims. Residents are being "
                f"advised to document visible damage and retain repair "
                f"records."
            ),
            article_type="INSURANCE",
        )
    )

    # ========================================================
    # 18 GOVERNMENT
    # ========================================================

    articles.append(
        make_article(
            event,
            "GOVERNMENT",
            f"Officials announce emergency response for {location}",
            "Authorities establish temporary measures following the battle.",
            (
                f"Local authorities have established an emergency response "
                f"operation covering transportation, housing, public safety "
                f"and infrastructure. Officials say repairs will begin "
                f"once damaged areas are declared safe."
            ),
            article_type="GOVERNMENT",
        )
    )

    # ========================================================
    # 19 NPC INTERVIEW
    # ========================================================

    quote = choose(
        event.get(
            "npc_quotes",
            [
                "My apartment is still standing. The street is not.",
                "The heroes left. We still have work tomorrow.",
                "Nobody asked whether our shop could survive another battle.",
                "I just want the bus to run again.",
            ],
        )
    )

    articles.append(
        make_article(
            event,
            "NPC LIFE",
            "Residents ask a simple question: Who pays for all this?",
            "Ordinary residents describe life after another superpowered confrontation.",
            (
                f"Residents of {location} say the aftermath is becoming "
                f"as important as the battle itself. One resident told "
                f"NPC News: \"{quote}\""
            ),
            article_type="NPC INTERVIEW",
        )
    )

    # ========================================================
    # 20 SOCIAL
    # ========================================================

    articles.append(
        make_article(
            event,
            "SOCIAL",
            f"Social media fills with reactions to {location} battle",
            "Residents share photographs, complaints and survival stories online.",
            (
                f"Social media platforms have filled with posts from "
                f"residents of {location}. Posts range from videos of "
                f"the confrontation to complaints about traffic, housing, "
                f"electricity and business closures."
            ),
            article_type="SOCIAL MEDIA",
        )
    )

    # ========================================================
    # 21 EMERGENCY SERVICES
    # ========================================================

    articles.append(
        make_article(
            event,
            "PUBLIC SAFETY",
            f"Emergency crews remain deployed across {location}",
            "Firefighters, rescue teams and utility workers continue operations.",
            (
                f"Emergency crews remain active throughout the affected "
                f"area. Teams are checking buildings, clearing debris "
                f"and assisting residents who cannot safely return home."
            ),
            article_type="EMERGENCY SERVICES",
        )
    )

    # ========================================================
    # 22 ENVIRONMENT
    # ========================================================

    articles.append(
        make_article(
            event,
            "ENVIRONMENT",
            f"Battle leaves environmental damage across {location}",
            "Officials inspect air, water and surrounding infrastructure.",
            (
                f"Environmental teams are inspecting the area for dust, "
                f"chemical leaks, damaged water systems and other secondary "
                f"effects associated with the confrontation."
            ),
            article_type="ENVIRONMENT",
        )
    )

    # ========================================================
    # 23 RECONSTRUCTION
    # ========================================================

    articles.append(
        make_article(
            event,
            "RECONSTRUCTION",
            f"Reconstruction begins as {location} counts its losses",
            "Repair crews begin the long process of restoring normal life.",
            (
                f"Repair crews are beginning preliminary work across "
                f"{location}. The first priorities include roads, utilities, "
                f"emergency facilities and buildings considered critical "
                f"to daily life."
            ),
            article_type="RECONSTRUCTION",
        )
    )

    # ========================================================
    # 24 ANALYSIS
    # ========================================================

    articles.append(
        make_article(
            event,
            "ANALYSIS",
            f"What happens to {location} after the heroes leave?",
            "The battle may have lasted minutes. The recovery could take months.",
            (
                f"The confrontation itself lasted {duration}, but the "
                f"effects will likely remain much longer. Residents now "
                f"face repairs, transport problems, temporary displacement "
                f"and economic disruption."
            ),
            article_type="LONG-TERM REPORT",
        )
    )

    # ========================================================
    # 25 MINOR LOCAL STORIES
    # ========================================================

    minor_stories = [
        (
            "LOCAL",
            f"Coffee shop reopens with limited menu in {location}",
            "A local café has reopened despite continuing infrastructure problems.",
        ),
        (
            "LOCAL",
            "Residents form neighborhood cleanup group",
            "Volunteers have begun clearing smaller debris from residential streets.",
        ),
        (
            "LOCAL",
            "Taxi drivers create temporary route around damaged roads",
            "Local drivers are using alternative roads to keep residents moving.",
        ),
        (
            "LOCAL",
            "Apartment residents return after structural inspection",
            "Some residents have been allowed to return to inspected buildings.",
        ),
        (
            "LOCAL",
            "Local supermarket reports unusually high demand",
            "Residents are stocking essential supplies while transport remains disrupted.",
        ),
        (
            "LOCAL",
            "Street vendors relocate during reconstruction",
            "Small vendors have moved to nearby streets while repairs continue.",
        ),
        (
            "LOCAL",
            "Office workers told to work remotely",
            "Several employers have temporarily changed working arrangements.",
        ),
        (
            "LOCAL",
            "Residents complain about debris collection delays",
            "Cleanup crews are working through multiple damaged areas.",
        ),
    ]

    for category, headline, summary in minor_stories:

        articles.append(
            make_article(
                event,
                category,
                headline,
                summary,
                (
                    f"Residents in {location} are adjusting to "
                    f"another small but significant consequence of "
                    f"the confrontation. Local services continue "
                    f"operating under unusual conditions."
                ),
                article_type="MINOR NEWS",
            )
        )

    return articles


# ============================================================
# BUILD COMPLETE EVENT OBJECT
# ============================================================

def prepare_event(event):

    event = dict(event)

    event["timeline"] = build_timeline(event)

    event["overview"] = build_overview(event)

    event["battle_report"] = build_battle_report(event)

    event["aftermath"] = build_aftermath(event)

    return event


# ============================================================
# MAIN GENERATOR
# ============================================================

def generate():

    ensure_directories()

    events = load_events()

    prepared_events = []

    all_articles = []

    # --------------------------------------------------------
    # PREPARE EVENTS
    # --------------------------------------------------------

    for event in events:

        validate_event(event)

        prepared_event = prepare_event(event)

        prepared_events.append(
            prepared_event
        )

    # --------------------------------------------------------
    # GENERATE ARTICLES
    # --------------------------------------------------------

    for event in prepared_events:

        articles = generate_articles(event)

        all_articles.extend(
            articles
        )

    # --------------------------------------------------------
    # RANDOMISE ARTICLE ORDER
    # --------------------------------------------------------

    random.shuffle(
        all_articles
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

        },

        # IMPORTANT:
        # The complete events are now included.
        "events":
            prepared_events,

        # All individual reports.
        "articles":
            all_articles,
    }

    # --------------------------------------------------------
    # WRITE NEWS.JSON
    # --------------------------------------------------------

    output_file = DIST_DIR / "news.json"

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

        source = STATIC_DIR / filename

        destination = DIST_DIR / filename

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
    print("=" * 60)
    print("NPC NEWS GENERATOR")
    print("=" * 60)

    print(
        f"Events generated : {len(prepared_events)}"
    )

    print(
        f"Articles created : {len(all_articles)}"
    )

    print(
        f"Output directory : {DIST_DIR}"
    )

    print(
        f"News file        : {output_file}"
    )

    print("=" * 60)
    print()

    print(
        "SUCCESS: Complete event data has been included in news.json."
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    generate()
