from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
from uuid import uuid4
import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

app = FastAPI(title="API Canciones – Ado")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL o SUPABASE_SERVICE_KEY no definidos en .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# buckets
AUDIO_BUCKET = "songs"
COVER_BUCKET = "covers"


# ===== MODELS =====
class Song(BaseModel):
    id: str
    title: str
    audio_url: str
    cover_url: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = 'original'

class NewsPost(BaseModel):
    id: str
    title: str
    content: str
    excerpt: Optional[str] = None
    category: str
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    author: Optional[str] = None
    image_url: Optional[str] = None
    published_date: datetime
    is_featured: bool = False
    tags: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class NewsCategory(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    created_at: Optional[datetime] = None

class NewsTag(BaseModel):
    id: str
    name: str
    color: Optional[str] = None
    created_at: Optional[datetime] = None

# ===== DATABASE FUNCTIONS =====

# Songs functions
def insert_song_db(row: dict):
    supabase.table("songs").insert(row).execute()

def fetch_song_row(song_id: str):
    res = supabase.table("songs").select("*").eq("id", song_id).single().execute()
    return res.data if res.data else None

# News functions
def insert_news_post(row: dict):
    result = supabase.table("news_posts").insert(row).execute()
    return result.data[0] if result.data else None

def fetch_news_post(post_id: str):
    res = supabase.table("news_posts").select("*").eq("id", post_id).single().execute()
    return res.data if res.data else None

def fetch_all_news():
    res = supabase.table("news_posts").select("*").order("published_date", desc=True).execute()
    return res.data if res.data else []

def fetch_news_by_category(category: str):
    res = supabase.table("news_posts").select("*").eq("category", category).order("published_date", desc=True).execute()
    return res.data if res.data else []

def fetch_featured_news():
    res = supabase.table("news_posts").select("*").eq("is_featured", True).order("published_date", desc=True).execute()
    return res.data if res.data else []

# Categories functions
def fetch_all_categories():
    res = supabase.table("news_categories").select("*").order("name", desc=False).execute()
    return res.data if res.data else []

def insert_category(row: dict):
    result = supabase.table("news_categories").insert(row).execute()
    return result.data[0] if result.data else None

# Tags functions
def fetch_all_tags():
    res = supabase.table("news_tags").select("*").order("name", desc=False).execute()
    return res.data if res.data else []

def insert_tag(row: dict):
    result = supabase.table("news_tags").insert(row).execute()
    return result.data[0] if result.data else None

# Endpoints


@app.post("/songs", response_model=Song, status_code=201)
async def upload_song(
    title: str = Form(...),
    file: UploadFile = File(...),
    cover: UploadFile | None = File(None),
    description: str | None = Form(None),
    category: str | None = Form('original')
):
    """Sube una nueva canción a Supabase Storage y guarda metadata en la tabla."""

    if not file.filename.lower().endswith(".mp3"):
        raise HTTPException(400, "Solo se permiten archivos MP3")

    song_id = str(uuid4())

    audio_path = f"{song_id}.mp3"
    audio_bytes = await file.read()
    try:
        supabase.storage.from_(AUDIO_BUCKET).upload(
            audio_path,
            audio_bytes,
            {"content-type": "audio/mpeg"}
        )
    except Exception as e:
        raise HTTPException(500, f"Error subiendo audio: {e}")

    audio_public_url = supabase.storage.from_(AUDIO_BUCKET).get_public_url(audio_path)

    cover_url = None
    cover_path = None
    if cover is not None:
        if not cover.filename.lower().endswith((".jpg", ".jpeg", ".png")):
            raise HTTPException(400, "La portada debe ser JPG o PNG")
        cover_ext = Path(cover.filename).suffix.lower()
        cover_path = f"{song_id}{cover_ext}"
        cover_bytes = await cover.read()
        try:
            supabase.storage.from_(COVER_BUCKET).upload(
                cover_path,
                cover_bytes,
                {"content-type": "image/jpeg" if cover_ext in [".jpg", ".jpeg"] else "image/png"}
            )
        except Exception as e:
            raise HTTPException(500, f"Error subiendo portada: {e}")
        cover_url = supabase.storage.from_(COVER_BUCKET).get_public_url(cover_path)

    row = {
        "id": song_id,
        "title": title,
        "audio_path": audio_path,
        "cover_path": cover_path if cover is not None else None,
        "audio_url": audio_public_url,
        "cover_url": cover_url,
        "description": description,
        "category": category,
    }

    insert_song_db(row)

    return Song(id=song_id, title=title, audio_url=audio_public_url, cover_url=cover_url, description=description, category=category)

@app.get("/songs", response_model=List[Song])
def list_songs():
    res = supabase.table("songs").select("id, title, audio_url, cover_url, description, category").order("created_at", desc=True).execute()
    return [Song(**row) for row in res.data]

@app.get("/songs/{song_id}", response_model=Song)
def get_song(song_id: str):
    row = fetch_song_row(song_id)
    if row:
        return Song(id=row["id"], title=row["title"], audio_url=row["audio_url"], cover_url=row.get("cover_url"), description=row.get("description"), category=row.get("category"))
    raise HTTPException(404, "Canción no encontrada")

@app.get("/songs/{song_id}/file")
def download_song(song_id: str):
    row = fetch_song_row(song_id)
    if row:
        return RedirectResponse(row["audio_url"])
    raise HTTPException(404, "Canción no encontrada")

@app.get("/songs/{song_id}/cover")
def download_cover(song_id: str):
    row = fetch_song_row(song_id)
    if row and row.get("cover_url"):
        return RedirectResponse(row["cover_url"])
    raise HTTPException(404, "Portada no encontrada")

@app.patch("/songs/{song_id}", response_model=Song)
async def update_song(
    song_id: str,
    title: str | None = Form(None),
    description: str | None = Form(None),
    category: str | None = Form(None),
    cover: UploadFile | None = File(None)
):
    row = fetch_song_row(song_id)
    if not row:
        raise HTTPException(404, "Canción no encontrada")

    updates = {}
    if title: updates["title"] = title
    if description is not None: updates["description"] = description
    if category: updates["category"] = category

    # reemplazar portada
    if cover is not None:
        if not cover.filename.lower().endswith((".jpg", ".jpeg", ".png")):
            raise HTTPException(400, "La portada debe ser JPG o PNG")
        cover_ext = Path(cover.filename).suffix.lower()
        cover_path = f"{song_id}{cover_ext}"
        cover_bytes = await cover.read()
        if row.get("cover_path"):
            supabase.storage.from_(COVER_BUCKET).remove([row["cover_path"]])
        supabase.storage.from_(COVER_BUCKET).upload(
            cover_path,
            cover_bytes,
            {"content-type": "image/jpeg" if cover_ext in [".jpg", ".jpeg"] else "image/png"}
        )
        cover_url = supabase.storage.from_(COVER_BUCKET).get_public_url(cover_path)
        updates["cover_path"] = cover_path
        updates["cover_url"] = cover_url

    if updates:
        supabase.table("songs").update(updates).eq("id", song_id).execute()

    new_row = fetch_song_row(song_id)
    return Song(id=new_row["id"], title=new_row["title"], audio_url=new_row["audio_url"], cover_url=new_row.get("cover_url"), description=new_row.get("description"), category=new_row.get("category"))

# ===== NEWS ENDPOINTS =====

@app.post("/news", response_model=NewsPost, status_code=201)
async def create_news_post(
    title: str = Form(...),
    content: str = Form(...),
    excerpt: str | None = Form(None),
    category: str = Form(...),
    source_url: str | None = Form(None),
    source_name: str | None = Form(None),
    author: str | None = Form(None),
    published_date: str = Form(...),  # ISO format string
    is_featured: bool = Form(False),
    tags: str = Form(""),  # Comma-separated tags
    image: UploadFile | None = File(None)
):
    """Creates a new news post"""
    
    post_id = str(uuid4())
    
    # Handle image upload if provided
    image_url = None
    if image is not None:
        if not image.filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            raise HTTPException(400, "Image must be JPG, PNG, or WebP")
        image_ext = Path(image.filename).suffix.lower()
        image_path = f"news/{post_id}{image_ext}"
        image_bytes = await image.read()
        try:
            supabase.storage.from_("covers").upload(  # Using covers bucket for now
                image_path,
                image_bytes,
                {"content-type": f"image/{image_ext[1:]}"}
            )
            image_url = supabase.storage.from_("covers").get_public_url(image_path)
        except Exception as e:
            raise HTTPException(500, f"Error uploading image: {e}")
    
    # Parse tags
    tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []
    
    # Parse published date
    try:
        pub_date = datetime.fromisoformat(published_date.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use ISO format.")
    
    row = {
        "id": post_id,
        "title": title,
        "content": content,
        "excerpt": excerpt,
        "category": category,
        "source_url": source_url,
        "source_name": source_name,
        "author": author,
        "image_url": image_url,
        "published_date": pub_date.isoformat(),
        "is_featured": is_featured,
        "tags": tag_list,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    insert_news_post(row)
    
    return NewsPost(**{k: v for k, v in row.items() if k in NewsPost.__fields__})

@app.get("/news", response_model=List[NewsPost])
def list_news(category: str | None = None, featured: bool | None = None):
    """Lists all news posts with optional filtering"""
    if featured:
        data = fetch_featured_news()
    elif category:
        data = fetch_news_by_category(category)
    else:
        data = fetch_all_news()
    
    return [NewsPost(**row) for row in data]

@app.get("/news/{post_id}", response_model=NewsPost)
def get_news_post(post_id: str):
    """Gets a specific news post by ID"""
    row = fetch_news_post(post_id)
    if row:
        return NewsPost(**row)
    raise HTTPException(404, "News post not found")

@app.patch("/news/{post_id}", response_model=NewsPost)
async def update_news_post(
    post_id: str,
    title: str | None = Form(None),
    content: str | None = Form(None),
    excerpt: str | None = Form(None),
    category: str | None = Form(None),
    source_url: str | None = Form(None),
    source_name: str | None = Form(None),
    author: str | None = Form(None),
    is_featured: bool | None = Form(None),
    tags: str | None = Form(None),
    image: UploadFile | None = File(None)
):
    """Updates an existing news post"""
    row = fetch_news_post(post_id)
    if not row:
        raise HTTPException(404, "News post not found")
    
    updates = {"updated_at": datetime.now().isoformat()}
    
    if title: updates["title"] = title
    if content: updates["content"] = content
    if excerpt is not None: updates["excerpt"] = excerpt
    if category: updates["category"] = category
    if source_url is not None: updates["source_url"] = source_url
    if source_name is not None: updates["source_name"] = source_name
    if author is not None: updates["author"] = author
    if is_featured is not None: updates["is_featured"] = is_featured
    if tags is not None:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else []
        updates["tags"] = tag_list
    
    # Handle image replacement
    if image is not None:
        if not image.filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            raise HTTPException(400, "Image must be JPG, PNG, or WebP")
        image_ext = Path(image.filename).suffix.lower()
        image_path = f"news/{post_id}{image_ext}"
        image_bytes = await image.read()
        
        # Remove old image if exists
        # (We'd need to store the image path in the DB to properly clean up)
        
        supabase.storage.from_("covers").upload(
            image_path,
            image_bytes,
            {"content-type": f"image/{image_ext[1:]}"}
        )
        image_url = supabase.storage.from_("covers").get_public_url(image_path)
        updates["image_url"] = image_url
    
    if updates:
        supabase.table("news_posts").update(updates).eq("id", post_id).execute()
    
    new_row = fetch_news_post(post_id)
    return NewsPost(**new_row)

@app.delete("/news/{post_id}")
def delete_news_post(post_id: str):
    """Deletes a news post"""
    row = fetch_news_post(post_id)
    if not row:
        raise HTTPException(404, "News post not found")
    
    supabase.table("news_posts").delete().eq("id", post_id).execute()
    return {"message": "News post deleted successfully"}

# ===== CATEGORY ENDPOINTS =====

@app.get("/news/categories", response_model=List[NewsCategory])
def list_categories():
    """Lists all news categories"""
    data = fetch_all_categories()
    return [NewsCategory(**row) for row in data]

@app.post("/news/categories", response_model=NewsCategory, status_code=201)
def create_category(
    name: str = Form(...),
    description: str | None = Form(None),
    color: str | None = Form(None),
    icon: str | None = Form(None)
):
    """Creates a new news category"""
    category_id = str(uuid4())
    row = {
        "id": category_id,
        "name": name,
        "description": description,
        "color": color,
        "icon": icon,
        "created_at": datetime.now().isoformat()
    }
    
    result = insert_category(row)
    return NewsCategory(**result)

# ===== TAG ENDPOINTS =====

@app.get("/news/tags", response_model=List[NewsTag])
def list_tags():
    """Lists all news tags"""
    data = fetch_all_tags()
    return [NewsTag(**row) for row in data]

@app.post("/news/tags", response_model=NewsTag, status_code=201)
def create_tag(
    name: str = Form(...),
    color: str | None = Form(None)
):
    """Creates a new news tag"""
    tag_id = str(uuid4())
    row = {
        "id": tag_id,
        "name": name,
        "color": color,
        "created_at": datetime.now().isoformat()
    }
    
    result = insert_tag(row)
    return NewsTag(**result)
