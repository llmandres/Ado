from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
from uuid import uuid4
import os
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


class Song(BaseModel):
    id: str
    title: str
    audio_url: str
    cover_url: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = 'original'

def insert_song_db(row: dict):
    supabase.table("songs").insert(row).execute()

def fetch_song_row(song_id: str):
    res = supabase.table("songs").select("*").eq("id", song_id).single().execute()
    return res.data if res.data else None

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
