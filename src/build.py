#!/usr/bin/env python3
import shutil, os
from jinja2 import Environment, FileSystemLoader
from markupsafe import Markup

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")

env = Environment(loader=FileSystemLoader(os.path.join(ROOT, "templates")))
base = env.get_template("base.html")

PAGES = [
    {"file": "index.html",            "active": "home",       "title": "Home",
     "description": "Journey Through Life Ministries — Christian coaching, community, and resources to help you discover your self-worth and identity in Christ."},
    {"file": "about.html",            "active": "about",      "title": "About Us",
     "description": "Meet Rev. Georgetta and Elder Charles, and learn the mission behind Journey Through Life Ministries."},
    {"file": "ministries.html",       "active": "ministries", "title": "Ministries",
     "description": "Explore our Women's Ministry, Men's Ministry, Financial Fitness coaching, and community programs."},
    {"file": "programs.html",         "active": "programs",   "title": "ALIVE Program",
     "description": "The ALIVE Living With Purpose Community — a 9-module coaching workshop for spiritual healing and purpose."},
    {"file": "events.html",           "active": "events",     "title": "Events & Workshops",
     "description": "Upcoming ALIVE Community workshops, free introductory sessions, and ministry events."},
    {"file": "library.html",          "active": "library",    "title": "Library",
     "description": "Books, devotional videos, audio messages, and free Bible lessons from Journey Through Life Ministries."},
    {"file": "prayer-requests.html",  "active": "prayer",     "title": "Prayer Requests",
     "description": "Submit a confidential prayer request to our ministry team."},
    {"file": "contact.html",          "active": "contact",    "title": "Contact",
     "description": "Get in touch with Journey Through Life Ministries."},
    {"file": "store.html",            "active": "store",      "title": "Store",
     "description": "Books, journals, and coaching resources from Journey Through Life Ministries."},
    {"file": "donate.html",           "active": "donate",     "title": "Give",
     "description": "Support the mission of Journey Through Life Ministries with a gift."},
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
