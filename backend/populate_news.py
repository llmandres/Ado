#!/usr/bin/env python3
"""
Script to populate the news database with real Ado news from research
"""

import os
import sys
from datetime import datetime
from uuid import uuid4
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in environment")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# News categories data
categories = [
    {
        "id": str(uuid4()),
        "name": "Albums & Releases",
        "description": "New albums, singles, and music releases",
        "color": "#8b5cf6",
        "icon": "🎵",
        "created_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid4()),
        "name": "Concerts & Tours",
        "description": "Live performances, concerts, and tour announcements",
        "color": "#ec4899",
        "icon": "🎤",
        "created_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid4()),
        "name": "Awards & Recognition",
        "description": "Awards, nominations, and achievements",
        "color": "#6366f1",
        "icon": "🏆",
        "created_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid4()),
        "name": "Collaborations",
        "description": "Collaborations with other artists and projects",
        "color": "#10b981",
        "icon": "🤝",
        "created_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid4()),
        "name": "Media & Interviews",
        "description": "Interviews, documentaries, and media appearances",
        "color": "#f59e0b",
        "icon": "📺",
        "created_at": datetime.now().isoformat()
    }
]

# News tags data
tags = [
    {"id": str(uuid4()), "name": "World Tour", "color": "#8b5cf6"},
    {"id": str(uuid4()), "name": "Album Release", "color": "#ec4899"},
    {"id": str(uuid4()), "name": "Concert Film", "color": "#6366f1"},
    {"id": str(uuid4()), "name": "Expo Performance", "color": "#10b981"},
    {"id": str(uuid4()), "name": "Anonymous Artist", "color": "#f59e0b"},
    {"id": str(uuid4()), "name": "Vocaloid", "color": "#ef4444"},
    {"id": str(uuid4()), "name": "One Piece", "color": "#06b6d4"},
    {"id": str(uuid4()), "name": "Best Album", "color": "#8b5cf6"},
    {"id": str(uuid4()), "name": "Japan National Stadium", "color": "#ec4899"}
]

# Real news posts based on research
news_posts = [
    {
        "id": str(uuid4()),
        "title": "Ado's Best Adobum Released April 8, 2025",
        "content": """Ado's first greatest hits album 'Ado's Best Adobum' was released digitally via Virgin Music on April 8, 2025, and physically the next day. The album includes songs from her first and second studio albums, 'Kyōgen' (2022) and 'Zanmu' (2024), alongside songs from her soundtrack album 'Uta's Songs: One Piece Film Red' (2022) and her cover album 'Ado's Utattemita Album' (2023).

The album is marketed by the slogan "All hits, no misses" and features 40 tracks across two discs. Six different versions were announced by Universal Music Japan, including a "Kigeki" Edition with a Blu-ray or DVD of Ado's debut concert at Zepp DiverCity Tokyo Plaza.

The album debuted at number one on various Japanese charts, continuing Ado's streak of chart-topping releases.""",
        "excerpt": "Ado releases her first greatest hits album featuring 40 tracks from her most successful releases.",
        "category": "Albums & Releases",
        "source_url": "https://en.wikipedia.org/wiki/Ado%27s_Best_Adobum",
        "source_name": "Wikipedia",
        "author": "Universal Music Japan",
        "published_date": "2025-04-08T00:00:00Z",
        "is_featured": True,
        "tags": ["Album Release", "Best Album"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid4()),
        "title": "Ado Kicks Off Osaka-Kansai Expo with Electrifying Live Show",
        "content": """To mark the start of the Osaka-Kansai Expo on April 13th, 2025, the acclaimed singer Ado graced the Expo Arena, known as "Matsuri," with a special live musical performance.

The announcement of this exclusive concert was officially made in September 2024, garnering considerable attention, particularly due to a full-page advertisement featured in the esteemed New York Times.

When the live show finally commenced at 7:45 pm, a substantial audience of approximately 16,000 fortunate individuals who had successfully secured tickets were completely captivated by Ado's powerful and emotive singing. Thousands of fans who were unable to obtain tickets still gathered outside the venue, dubbed "sound leakage refugees" by fellow enthusiasts.""",
        "excerpt": "Ado delivers a spectacular performance to 16,000 fans at the Osaka-Kansai Expo opening ceremony.",
        "category": "Concerts & Tours",
        "source_url": "https://essential-japan.com/news/ado-kicks-off-osaka-kansai-expo-with-electrifying-live-show/",
        "source_name": "Essential Japan",
        "author": "James Richardson",
        "published_date": "2025-04-13T19:45:00Z",
        "is_featured": True,
        "tags": ["Expo Performance", "Anonymous Artist"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid4()),
        "title": "Ado's 'Shinzou' Concert Film Hits U.S. Theaters Starting May 28, 2025",
        "content": """GAGA Corporation has announced that the concert film 'Ado SPECIAL LIVE 'Shinzou' in Cinema' will screen in select U.S. theaters on May 28 and 31, 2025. The concert film provides an immersive journey into Ado's legendary live concert "Shinzou" at the Japan National Stadium in 2024.

The theatrical release features newly remastered 5.1 and Dolby Atmos audio mixes for unparalleled sound quality in theaters. "Shinzou" was a legendary performance that established Ado as the first solo female artist to perform at the iconic Japan National Stadium, attracting 140,000 fans over two days (April 27–28, 2024).

The setlist featured 26 songs, including her on-stage duet of "Sakura Biyori and Time Machine (with Hatsune Miku)," the highly acclaimed "DIGNITY" featuring guest guitarist Tak Matsumoto (from B'z), and "Show," a collaboration song with Universal Studios Japan.""",
        "excerpt": "Ado's historic Japan National Stadium concert gets theatrical release in the U.S. with premium audio.",
        "category": "Media & Interviews",
        "source_url": "https://animecorner.me/ados-shinzou-concert-film-hits-u-s-theaters-starting-may-28-2025/",
        "source_name": "Anime Corner",
        "author": "Ken Pueyo",
        "published_date": "2025-05-02T00:00:00Z",
        "is_featured": False,
        "tags": ["Concert Film", "Japan National Stadium", "Vocaloid"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid4()),
        "title": "Ado Brings Anonymous Artistry to Australia on Hibana World Tour",
        "content": """One of Japan's biggest stars, the singer Ado, made her Australian debut in May 2025 as part of her current 'Hibana' world tour. The 22-year-old is a superstar whose identity remains a closely guarded secret.

She never reveals her real name or her face, instead using an anime avatar to promote her work. At her concerts, she performs entirely in silhouette from inside a transparent box while her four-piece band performs below as silhouettes.

The Melbourne show at Rod Laver Arena was a sold-out spectacle featuring vibrant, flashy visuals that filled the venue. Crowd favorites included "Show," "Odo," "Hibana," "Kura Kura" from Spy × Family, "Gira Gira," "New Genesis," and a stunning cover of Sia's "Chandelier" reworked as a J-Rock power-ballad.

The tour demonstrates how Japanese music is embracing the global stage, with Ado proving that artistry can transcend physical appearance.""",
        "excerpt": "Ado's sold-out Australian debut showcases her unique anonymous performance style to international audiences.",
        "category": "Concerts & Tours",
        "source_url": "https://www.lilithia.net/ado-world-tour-hibana-melbourne-2025/",
        "source_name": "Lilithia Reviews",
        "author": "Stephanie Chin",
        "published_date": "2025-05-27T20:00:00Z",
        "is_featured": False,
        "tags": ["World Tour", "Anonymous Artist"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid4()),
        "title": "The Voice of Gen Z: Ado's Rise from Bedroom Artist to Global Phenomenon",
        "content": """From releasing covers in her bedroom to becoming the voice of non-conformist Gen Z in Japan, Ado's journey represents a new era in Japanese music. The mysterious singer, who famously hides her identity, has broken through to international success with her raw, emotional performances and anime-influenced artistry.

Her breakthrough single "Usseewa" (meaning "shut up") hit a raw nerve in Japan, where social pressure to conform is extreme. The song featured brash punk tempo, lyrics questioning authority, and Ado's piercing screams, making her the voice of a generation feeling stifled by traditional values.

What makes Ado unique is her connection to Vocaloid culture - software with synthetic voices that can be made to sing anything. She cites virtual pop singer Hatsune Miku as a major influence and has mastered the art of making impossible vocal ranges sound human.

Her recent world tour 'Wish' saw her becoming the first ever female artist to headline the Japan National Stadium, alongside successful shows in the US and Europe. Her 2024 sophomore album 'Zanmu' shot straight to the top of Japanese charts and was certified gold.""",
        "excerpt": "An in-depth look at how Ado became the voice of Japanese Gen Z and achieved global success while maintaining anonymity.",
        "category": "Media & Interviews",
        "source_url": "https://www.theguardian.com/music/2024/mar/11/ado-platinum-selling-pop-star-secret-identity-troxy-london",
        "source_name": "The Guardian",
        "author": "Daniel Robson",
        "published_date": "2024-03-11T12:20:00Z",
        "is_featured": True,
        "tags": ["Anonymous Artist", "Vocaloid", "Japan National Stadium"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": str(uuid4()),
        "title": "Ado's Ongoing North American Tour Dates Announced",
        "content": """Following the massive success of her Australian dates, Ado continues her 'Hibana' world tour with upcoming North American shows. The tour includes major venues across the United States and Canada.

Confirmed dates include:
- August 3, 2025: Scotiabank Arena, Toronto, ON
- August 5, 2025: Prudential Center, Newark, NJ  
- August 14, 2025: Blaisdell Arena, Honolulu, HI
- August 24, 2025: Blaisdell Arena, Honolulu, HI

The tour setlist features fan favorites like "Usseewa," "Gira Gira," "Show," "Kura Kura," and her acclaimed cover of Sia's "Chandelier." Each show maintains Ado's signature anonymous performance style with elaborate lighting and visual effects.

Tickets for all shows have been selling rapidly, demonstrating the growing international appetite for Japanese music and Ado's unique artistry.""",
        "excerpt": "Ado announces additional North American tour dates following sold-out Australian shows.",
        "category": "Concerts & Tours",
        "source_url": "https://www.jambase.com/show/ado-scotiabank-arena-20250803",
        "source_name": "JamBase",
        "author": "Tour Announcement",
        "published_date": "2025-06-15T00:00:00Z",
        "is_featured": False,
        "tags": ["World Tour"],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
]

def populate_database():
    """Populate the database with categories, tags, and news posts"""
    try:
        print("🗂️  Creating news categories...")
        for category in categories:
            result = supabase.table("news_categories").insert(category).execute()
            if result.data:
                print(f"   ✅ Created category: {category['name']}")
            else:
                print(f"   ❌ Failed to create category: {category['name']}")

        print("\n🏷️  Creating news tags...")
        for tag in tags:
            result = supabase.table("news_tags").insert(tag).execute()
            if result.data:
                print(f"   ✅ Created tag: {tag['name']}")
            else:
                print(f"   ❌ Failed to create tag: {tag['name']}")

        print("\n📰 Creating news posts...")
        for post in news_posts:
            result = supabase.table("news_posts").insert(post).execute()
            if result.data:
                print(f"   ✅ Created post: {post['title'][:50]}...")
            else:
                print(f"   ❌ Failed to create post: {post['title'][:50]}...")

        print(f"\n🎉 Successfully populated database with:")
        print(f"   📂 {len(categories)} categories")
        print(f"   🏷️  {len(tags)} tags")
        print(f"   📰 {len(news_posts)} news posts")

    except Exception as e:
        print(f"❌ Error populating database: {e}")
        return False

    return True

if __name__ == "__main__":
    print("🚀 Starting Ado News Database Population...")
    print("=" * 50)
    
    success = populate_database()
    
    if success:
        print("\n✅ Database population completed successfully!")
        print("\nℹ️  You can now:")
        print("   • View news at: GET /news")
        print("   • View categories at: GET /news/categories") 
        print("   • View tags at: GET /news/tags")
        print("   • Filter by category: GET /news?category=Concerts%20%26%20Tours")
        print("   • View featured posts: GET /news?featured=true")
    else:
        print("\n❌ Database population failed!")
        sys.exit(1)