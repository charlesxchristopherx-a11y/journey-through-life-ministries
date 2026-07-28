#!/usr/bin/env python3
import shutil, os
from jinja2 import Environment, FileSystemLoader
from markupsafe import Markup

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")

env = Environment(loader=FileSystemLoader(os.path.join(ROOT, "templates")))
base = env.get_template("base.html")

PAGES = [
    {"file": "index.html",            "active": "home",    "title": "Home",
     "description": "Journey Through Life Ministries — Christian coaching and sisterhood to help women 40+ discover their self-worth and identity in Christ."},
    {"file": "about.html",            "active": "about",   "title": "About Georgetta",
     "description": "Meet Rev. Georgetta, founder of Journey Through Life Ministries and the Alive Community."},
    {"file": "alive-community.html",  "active": "alive",   "title": "Alive Community",
     "description": "The Alive Community Membership Program — our 3-Pillar Framework of Identity, Inner Healing, and Kingdom Purpose."},
    {"file": "reset-and-restart.html","active": "reset",   "title": "Reset & Restart",
     "description": "Reset & Restart: Living With Purpose — a 90-day journal and planner for women 40 and up."},
    {"file": "library.html",         "active": "library",  "title": "Library",
     "description": "Audio messages and teaching resources from Rev. Georgetta."},
    {"file": "store.html",           "active": "store",    "title": "Store",
     "description": "Journals, workbooks, and coaching resources from Journey Through Life Ministries."},
    {"file": "free-guides.html",     "active": "guides",   "title": "Free Guides",
     "description": "Get a free identity guide or prayer guide from Journey Through Life Ministries."},
    {"file": "prayer-requests.html", "active": "prayer",   "title": "Prayer Requests",
     "description": "Submit a confidential prayer request to our ministry team."},
    {"file": "give.html",            "active": "give",     "title": "Give",
     "description": "Support the mission of Journey Through Life Ministries with a gift."},
    {"file": "contact.html",         "active": "contact",  "title": "Contact",
     "description": "Get in touch with Journey Through Life Ministries."},
]

def main():
    if os.path.exists(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)

    # copy assets
    shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(DIST, "assets"))

    for page in PAGES:
        with open(os.path.join(ROOT, "pages", page["file"]), encoding="utf-8") as f:
            content = f.read()
        html = base.render(
            title=page["title"],
            description=page["description"],
            active=page["active"],
            content=Markup(content),
            year="2026",
        )
        with open(os.path.join(DIST, page["file"]), "w", encoding="utf-8") as f:
            f.write(html)

    print(f"Built {len(PAGES)} pages into {DIST}")

if __name__ == "__main__":
    main()
