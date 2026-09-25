import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent

DATA_FILE = ROOT / "data" / "news.json"
TEMPLATE_FILE = ROOT / "templates" / "article.html"
DIST = ROOT / "dist"

DIST.mkdir(exist_ok=True)


def load_json():
    with open(DATA_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def load_template():
    with open(TEMPLATE_FILE, "r", encoding="utf-8") as file:
        return file.read()


def create_article(event, template):
    damage = event["damage"]

    consequence = random.choice(event["consequences"])
    npc_reaction = random.choice(event["npc_reactions"])

    article = template.format(
        universe=event["universe"],
        location=event["location"],
        headline=event["headline"],
        character_a=event["characters"][0],
        character_b=event["characters"][1],
        winner=event["winner"],
        duration=event["duration"],

        buildings=damage["buildings"],
        roads=damage["roads"],
        vehicles=damage["vehicles"],
        businesses=damage["businesses"],
        npcs=damage["npcs"],

        consequence=consequence,
        npc_reaction=npc_reaction
    )

    return article


def generate_news():

    data = load_json()
    template = load_template()

    articles = []

    for event in data["events"]:

        # Generate many variations from the same event
        for _ in range(25):

            article = create_article(
                event,
                template
            )

            articles.append(article)

    random.shuffle(articles)

    with open(
        DIST / "news.json",
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            articles,
            file,
            ensure_ascii=False,
            indent=2
        )

    print()
    print("================================")
    print("       NPC NEWS GENERATOR")
    print("================================")
    print()
    print(f"Generated {len(articles)} stories.")
    print()
    print("News database:")
    print(DIST / "news.json")
    print()


if __name__ == "__main__":
    generate_news()
