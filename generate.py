from __future__ import annotations

import json
import random
import shutil
from datetime import datetime, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DIST_DIR = ROOT / "dist"
STATIC_DIR = ROOT / "static"

EVENTS_FILE = DATA_DIR / "events.json"


def ensure_directories():
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_events():
    with EVENTS_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


def clean_text(value):
    return str(value).strip()


def money(value):
    return f"${value:,}"


def number(value):
    return f"{value:,}"


def random_id():
    return f"NPC-{random.randint(100000, 999999)}"


def choose(items):
    return random.choice(items)


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
        "winner": event.get("winner", "Unknown"),
        "published": datetime.now().strftime("%Y-%m-%d %H:%M"),
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


def generate_articles(event):
    articles = []

    world = event["world"]
    location = event["location"]
    hero = event["characters"][0]
    villain = event["characters"][1]

    winner = event.get("winner", hero)

    buildings = event["damage"]["buildings"]
    roads = event["damage"]["roads"]
    vehicles = event["damage"]["vehicles"]
    businesses = event["damage"]["businesses"]
    npc_affected = event["damage"]["npc_affected"]

    injuries = event["damage"].get("injuries", 0)
    missing = event["damage"].get("missing", 0)
    displaced = event["damage"].get("displaced", 0)

    duration = event.get("duration", "unknown")

    transport_routes = event["consequences"].get(
        "transport_routes",
        3
    )

    schools = event["consequences"].get(
        "schools_closed",
        0
    )

    hospitals = event["consequences"].get(
        "hospitals_affected",
        1
    )

    utilities = event["consequences"].get(
        "utilities",
        "power and water services are being inspected"
    )

    economic_loss = event["consequences"].get(
        "economic_loss",
        0
    )

    # ---------------------------------------------------------
    # 1. BREAKING NEWS
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "BREAKING",
            f"{hero} defeats {villain} after {duration} battle",
            f"The battle in {location} has ended, but thousands of ordinary residents are now dealing with the aftermath.",
            (
                f"{location} — The confrontation between {hero} and {villain} "
                f"has ended after approximately {duration}. "
                f"{winner} has been declared the victor. "
                f"Emergency crews are now entering the affected area while "
                f"residents attempt to determine whether their homes, workplaces "
                f"and normal routines can continue."
            ),
            priority="URGENT",
            article_type="BREAKING",
        )
    )

    # ---------------------------------------------------------
    # 2. BATTLE REPORT
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "BATTLE",
            f"{hero} vs {villain}: What happened in {location}",
            "A timeline of the confrontation and its immediate consequences.",
            (
                f"The confrontation began in {location} and continued for "
                f"{duration}. Witnesses reported repeated impacts across the "
                f"district. The fighters eventually left the immediate area, "
                f"leaving emergency crews to assess the damage."
            ),
            priority="HIGH",
            article_type="BATTLE REPORT",
        )
    )

    # ---------------------------------------------------------
    # 3. DAMAGE
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "DAMAGE",
            f"{number(buildings)} buildings affected after {hero}-{villain} battle",
            f"Structural inspections have begun across {location}.",
            (
                f"Officials say at least {number(buildings)} buildings have "
                f"been damaged or otherwise affected. Engineers are inspecting "
                f"structures before residents are allowed to return."
            ),
            priority="HIGH",
            article_type="DAMAGE REPORT",
        )
    )

    # ---------------------------------------------------------
    # 4. ROADS
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "TRANSPORT",
            f"{number(roads)} roads affected following battle",
            "Drivers are being warned to avoid the affected district.",
            (
                f"At least {number(roads)} roads in and around {location} "
                f"are affected. Officials have placed temporary restrictions "
                f"on several routes while engineers inspect damaged surfaces, "
                f"bridges and intersections."
            ),
            article_type="TRANSPORT",
        )
    )

    # ---------------------------------------------------------
    # 5. VEHICLES
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "TRANSPORT",
            f"{number(vehicles)} vehicles damaged in {location}",
            "Residents are reporting widespread vehicle damage.",
            (
                f"Emergency responders and residents have reported damage to "
                f"approximately {number(vehicles)} vehicles. Some were caught "
                f"in the immediate battle zone while others were damaged by "
                f"falling debris and secondary impacts."
            ),
            article_type="LOCAL REPORT",
        )
    )

    # ---------------------------------------------------------
    # 6. PUBLIC TRANSPORT
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "TRANSPORT",
            f"{number(transport_routes)} public transport routes suspended",
            "Commuters face delays while infrastructure inspections continue.",
            (
                f"Transit authorities have suspended {number(transport_routes)} "
                f"routes serving {location}. Officials say services will resume "
                f"after roads and stations are declared safe."
            ),
            article_type="TRANSIT UPDATE",
        )
    )

    # ---------------------------------------------------------
    # 7. BUSINESS
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "BUSINESS",
            f"{number(businesses)} businesses affected by battle",
            "Shop owners say the fight has created another unexpected business crisis.",
            (
                f"At least {number(businesses)} businesses have reported damage, "
                f"closures or severe interruptions. Restaurants, retail stores, "
                f"offices and independent businesses are among those affected."
            ),
            article_type="BUSINESS REPORT",
        )
    )

    # ---------------------------------------------------------
    # 8. EMPLOYMENT
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "EMPLOYMENT",
            f"Workers struggle to reach jobs after {location} disruption",
            "Thousands of employees face another day of disrupted commuting.",
            (
                f"Businesses say workers are having difficulty reaching their "
                f"jobs because of damaged roads and suspended transport. "
                f"Some employers have moved temporarily to remote operations "
                f"where possible."
            ),
            article_type="LABOR REPORT",
        )
    )

    # ---------------------------------------------------------
    # 9. HOUSING
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "HOUSING",
            f"{number(displaced)} residents temporarily displaced",
            "Families are looking for temporary accommodation after the battle.",
            (
                f"Approximately {number(displaced)} residents have been "
                f"temporarily displaced. Local shelters, relatives and nearby "
                f"hotels are being used while structural inspections continue."
            ),
            article_type="HOUSING REPORT",
        )
    )

    # ---------------------------------------------------------
    # 10. SCHOOLS
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "EDUCATION",
            f"{number(schools)} schools affected by the battle aftermath",
            "Students and teachers face disrupted schedules.",
            (
                f"{number(schools)} schools in the wider {location} area "
                f"have suspended classes or changed schedules. Officials say "
                f"the decision is intended to keep students away from damaged "
                f"infrastructure."
            ),
            article_type="EDUCATION",
        )
    )

    # ---------------------------------------------------------
    # 11. HOSPITALS
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "HEALTH",
            f"{number(hospitals)} hospitals affected by emergency response",
            "Medical facilities activate emergency procedures.",
            (
                f"{number(hospitals)} medical facilities have activated "
                f"emergency procedures following the incident. Hospitals are "
                f"treating injuries while attempting to maintain normal care "
                f"for patients who were already receiving treatment."
            ),
            article_type="HEALTH REPORT",
        )
    )

    # ---------------------------------------------------------
    # 12. INJURIES
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "HEALTH",
            f"{number(injuries)} injuries reported after {location} battle",
            "Medical teams continue to assess residents and responders.",
            (
                f"Officials have reported approximately {number(injuries)} "
                f"injuries associated with the incident. The figure may change "
                f"as hospitals complete their assessments."
            ),
            priority="HIGH",
            article_type="CASUALTY UPDATE",
        )
    )

    # ---------------------------------------------------------
    # 13. MISSING PERSONS
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "PUBLIC SAFETY",
            f"{number(missing)} people reported missing after battle",
            "Families are waiting for information as search teams enter damaged areas.",
            (
                f"Authorities say {number(missing)} people have been reported "
                f"missing. Search and rescue teams are checking damaged "
                f"buildings and surrounding areas."
            ),
            priority="HIGH",
            article_type="PUBLIC SAFETY",
        )
    )

    # ---------------------------------------------------------
    # 14. UTILITIES
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "UTILITIES",
            f"Utility services disrupted across parts of {location}",
            utilities,
            (
                f"Utility crews are inspecting infrastructure after the battle. "
                f"{utilities.capitalize()}. Residents are being advised to "
                f"prepare for temporary interruptions."
            ),
            article_type="UTILITY UPDATE",
        )
    )

    # ---------------------------------------------------------
    # 15. FOOD
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "NPC LIFE",
            f"Food deliveries delayed across {location}",
            "Restaurants and grocery stores report supply problems.",
            (
                f"Damage to roads and transport infrastructure is delaying "
                f"food deliveries across {location}. Restaurants are reporting "
                f"late shipments while grocery stores are checking alternative "
                f"supply routes."
            ),
            article_type="DAILY LIFE",
        )
    )

    # ---------------------------------------------------------
    # 16. ECONOMY
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "ECONOMY",
            f"Battle damage could cost {money(economic_loss)}",
            "Local officials begin calculating the financial consequences.",
            (
                f"Preliminary estimates place the economic impact at around "
                f"{money(economic_loss)}. The estimate includes infrastructure, "
                f"business interruption, vehicle damage and emergency response."
            ),
            priority="HIGH",
            article_type="ECONOMIC REPORT",
        )
    )

    # ---------------------------------------------------------
    # 17. INSURANCE
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "ECONOMY",
            f"Insurance offices prepare for surge in {location} claims",
            "Property owners begin documenting battle-related damage.",
            (
                f"Insurance companies are preparing for a large number of "
                f"property and vehicle claims. Residents are being advised "
                f"to document visible damage and retain repair records."
            ),
            article_type="INSURANCE",
        )
    )

    # ---------------------------------------------------------
    # 18. GOVERNMENT
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "GOVERNMENT",
            f"Officials announce emergency response for {location}",
            "Authorities establish temporary measures following the battle.",
            (
                f"Local authorities have established an emergency response "
                f"operation covering transportation, housing, public safety "
                f"and infrastructure. Officials say repairs will begin once "
                f"damaged areas are declared safe."
            ),
            article_type="GOVERNMENT",
        )
    )

    # ---------------------------------------------------------
    # 19. NPC INTERVIEW
    # ---------------------------------------------------------

    quote = choose(event.get("npc_quotes", [
        "My apartment is still standing. The street is not.",
        "The heroes left. We still have work tomorrow.",
        "Nobody asked whether our shop could survive another battle.",
        "I just want the bus to run again.",
    ]))

    articles.append(
        make_article(
            event,
            "NPC LIFE",
            f"Residents ask a simple question: Who pays for all this?",
            "Ordinary residents describe life after another superpowered confrontation.",
            (
                f'Residents of {location} say the aftermath is becoming as '
                f'important as the battle itself. One resident told NPC News: '
                f'"{quote}"'
            ),
            article_type="NPC INTERVIEW",
        )
    )

    # ---------------------------------------------------------
    # 20. SOCIAL MEDIA
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "SOCIAL",
            f"Social media fills with reactions to {location} battle",
            "Residents share photographs, complaints and survival stories online.",
            (
                f"Social media platforms have filled with posts from residents "
                f"of {location}. Posts range from videos of the confrontation "
                f"to complaints about traffic, housing, electricity and business "
                f"closures."
            ),
            article_type="SOCIAL MEDIA",
        )
    )

    # ---------------------------------------------------------
    # 21. EMERGENCY SERVICES
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "PUBLIC SAFETY",
            f"Emergency crews remain deployed across {location}",
            "Firefighters, rescue teams and utility workers continue operations.",
            (
                f"Emergency crews remain active throughout the affected area. "
                f"Teams are checking buildings, clearing debris and assisting "
                f"residents who cannot safely return home."
            ),
            article_type="EMERGENCY SERVICES",
        )
    )

    # ---------------------------------------------------------
    # 22. ENVIRONMENT
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # 23. RECONSTRUCTION
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "RECONSTRUCTION",
            f"Reconstruction begins as {location} counts its losses",
            "Repair crews begin the long process of restoring normal life.",
            (
                f"Repair crews are beginning preliminary work across {location}. "
                f"The first priorities include roads, utilities, emergency "
                f"facilities and buildings considered critical to daily life."
            ),
            article_type="RECONSTRUCTION",
        )
    )

    # ---------------------------------------------------------
    # 24. LONG TERM
    # ---------------------------------------------------------

    articles.append(
        make_article(
            event,
            "ANALYSIS",
            f"What happens to {location} after the heroes leave?",
            "The battle may have lasted minutes. The recovery could take months.",
            (
                f"The confrontation itself lasted {duration}, but the effects "
                f"will likely remain much longer. Residents now face repairs, "
                f"transport problems, temporary displacement and economic "
                f"disruption."
            ),
            article_type="LONG-TERM REPORT",
        )
    )

    # ---------------------------------------------------------
    # 25. MINOR LOCAL NEWS
    # ---------------------------------------------------------

    minor_stories = [
        (
            "LOCAL",
            f"Coffee shop reopens with limited menu in {location}",
            "A local café has reopened despite continuing infrastructure problems."
        ),
        (
            "LOCAL",
            f"Residents form neighborhood cleanup group",
            "Volunteers have begun clearing smaller debris from residential streets."
        ),
        (
            "LOCAL",
            f"Taxi drivers create temporary route around damaged roads",
            "Local drivers are using alternative roads to keep residents moving."
        ),
        (
            "LOCAL",
            f"Apartment residents return after structural inspection",
            "Some residents have been allowed to return to inspected buildings."
        ),
        (
            "LOCAL",
            f"Local supermarket reports unusually high demand",
            "Residents are stocking essential supplies while transport remains disrupted."
        ),
        (
            "LOCAL",
            f"Street vendors relocate during reconstruction",
            "Small vendors have moved to nearby streets while repairs continue."
        ),
        (
            "LOCAL",
            f"Office workers told to work remotely",
            "Several employers have temporarily changed working arrangements."
        ),
        (
            "LOCAL",
            f"Residents complain about debris collection delays",
            "Cleanup crews are working through multiple damaged areas."
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
                    f"Residents in {location} are adjusting to another "
                    f"small but significant consequence of the confrontation. "
                    f"Local services continue operating under unusual conditions."
                ),
                article_type="MINOR NEWS",
            )
        )

    return articles


def generate():
    ensure_directories()

    events = load_events()

    all_articles = []

    for event in events:
        all_articles.extend(generate_articles(event))

    random.shuffle(all_articles)

    output = {
        "site": {
            "name": "NPC NEWS",
            "tagline": "THE HEROES WIN. THE NPCs LIVE WITH IT.",
            "description": "FICTIONAL WORLD NEWS NETWORK",
            "generated_at": datetime.now().isoformat(),
            "article_count": len(all_articles),
            "event_count": len(events),
        },
        "articles": all_articles,
    }

    with (DIST_DIR / "news.json").open("w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    # Copy static files into dist
    for filename in ["index.html", "styles.css", "app.js"]:
        source = STATIC_DIR / filename
        destination = DIST_DIR / filename

        if source.exists():
            shutil.copy2(source, destination)

    print("=" * 60)
    print("NPC NEWS GENERATOR")
    print("=" * 60)
    print(f"Events generated : {len(events)}")
    print(f"Articles created : {len(all_articles)}")
    print(f"Output directory : {DIST_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    generate()
