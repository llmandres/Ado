-- =====================================================
-- ADO MUSIC APP - DATABASE SCHEMA DOCUMENTATION
-- Sistema completo para gestión de canciones y noticias
-- =====================================================

-- NOTAS IMPORTANTES:
-- Este archivo documenta el esquema de base de datos necesario para Supabase PostgreSQL
-- Incluye las tablas existentes (songs) y las nuevas tablas para el sistema de noticias

-- =====================================================
-- TABLA EXISTENTE: SONGS
-- =====================================================

-- Esta tabla ya existe y almacena información sobre las canciones subidas
CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    audio_path TEXT NOT NULL,
    cover_path TEXT,
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    description TEXT,
    category TEXT DEFAULT 'original' CHECK (category IN ('original', 'cover')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_songs_category ON songs(category);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at DESC);

-- =====================================================
-- NUEVAS TABLAS: SISTEMA DE NOTICIAS
-- =====================================================

-- TABLA: news_categories
-- Categorías para organizar las noticias (Albums, Concerts, Awards, etc.)
CREATE TABLE IF NOT EXISTS news_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT, -- Color hexadecimal para la categoría (#8b5cf6)
    icon TEXT, -- Emoji o icono para la categoría
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: news_tags  
-- Tags/etiquetas para clasificar noticias de forma más granular
CREATE TABLE IF NOT EXISTS news_tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT, -- Color hexadecimal para el tag
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA PRINCIPAL: news_posts
-- Almacena todas las noticias del sistema
CREATE TABLE IF NOT EXISTS news_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT, -- Resumen breve de la noticia
    category TEXT NOT NULL, -- Referencia al nombre de la categoría
    source_url TEXT, -- URL del artículo original
    source_name TEXT, -- Nombre de la fuente (The Guardian, Wikipedia, etc.)
    author TEXT, -- Autor del artículo
    image_url TEXT, -- URL de la imagen principal
    published_date TIMESTAMPTZ NOT NULL, -- Fecha original de publicación
    is_featured BOOLEAN DEFAULT FALSE, -- Si es noticia destacada
    tags TEXT[] DEFAULT '{}', -- Array de tags como strings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para asegurar que la categoría existe
    CONSTRAINT fk_news_category 
        FOREIGN KEY (category) 
        REFERENCES news_categories(name) 
        ON UPDATE CASCADE
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE RENDIMIENTO
-- =====================================================

-- Índices para news_posts
CREATE INDEX IF NOT EXISTS idx_news_posts_category ON news_posts(category);
CREATE INDEX IF NOT EXISTS idx_news_posts_published_date ON news_posts(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_is_featured ON news_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_news_posts_created_at ON news_posts(created_at DESC);

-- Índice para búsqueda por tags usando GIN
CREATE INDEX IF NOT EXISTS idx_news_posts_tags ON news_posts USING GIN(tags);

-- Índice compuesto para consultas filtradas comunes
CREATE INDEX IF NOT EXISTS idx_news_posts_category_published ON news_posts(category, published_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_posts_featured_published ON news_posts(is_featured, published_date DESC) WHERE is_featured = true;

-- =====================================================
-- FUNCIONES DE UTILIDAD Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para news_posts
CREATE OR REPLACE TRIGGER update_news_posts_updated_at 
    BEFORE UPDATE ON news_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para songs (si no existe)
CREATE OR REPLACE TRIGGER update_songs_updated_at 
    BEFORE UPDATE ON songs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_tags ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública (anyone can read)
CREATE POLICY "Public read access" ON songs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON news_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON news_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON news_tags FOR SELECT TO anon, authenticated USING (true);

-- Políticas para escritura solo con service_role
-- (Solo el backend con service_role key puede insertar/actualizar/eliminar)
CREATE POLICY "Service role full access" ON songs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON news_posts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON news_categories FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON news_tags FOR ALL TO service_role USING (true);

-- =====================================================
-- DATOS INICIALES DE EJEMPLO
-- =====================================================

-- Insertar categorías iniciales
INSERT INTO news_categories (id, name, description, color, icon) VALUES
('cat_albums', 'Albums & Releases', 'New albums, singles, and music releases', '#8b5cf6', '🎵'),
('cat_concerts', 'Concerts & Tours', 'Live performances, concerts, and tour announcements', '#ec4899', '🎤'),
('cat_awards', 'Awards & Recognition', 'Awards, nominations, and achievements', '#6366f1', '🏆'),
('cat_collabs', 'Collaborations', 'Collaborations with other artists and projects', '#10b981', '🤝'),
('cat_media', 'Media & Interviews', 'Interviews, documentaries, and media appearances', '#f59e0b', '📺')
ON CONFLICT (name) DO NOTHING;

-- Insertar tags iniciales
INSERT INTO news_tags (id, name, color) VALUES
('tag_world_tour', 'World Tour', '#8b5cf6'),
('tag_album_release', 'Album Release', '#ec4899'),
('tag_concert_film', 'Concert Film', '#6366f1'),
('tag_expo', 'Expo Performance', '#10b981'),
('tag_anonymous', 'Anonymous Artist', '#f59e0b'),
('tag_vocaloid', 'Vocaloid', '#ef4444'),
('tag_one_piece', 'One Piece', '#06b6d4'),
('tag_best_album', 'Best Album', '#8b5cf6'),
('tag_national_stadium', 'Japan National Stadium', '#ec4899')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- CONSULTAS DE EJEMPLO PARA TESTING
-- =====================================================

/*
-- Obtener todas las noticias con información de categoría
SELECT 
    np.id,
    np.title,
    np.excerpt,
    np.category,
    nc.color as category_color,
    nc.icon as category_icon,
    np.published_date,
    np.is_featured,
    np.tags
FROM news_posts np
JOIN news_categories nc ON np.category = nc.name
ORDER BY np.published_date DESC;

-- Obtener noticias destacadas
SELECT * FROM news_posts 
WHERE is_featured = true 
ORDER BY published_date DESC;

-- Obtener noticias por categoría
SELECT * FROM news_posts 
WHERE category = 'Concerts & Tours' 
ORDER BY published_date DESC;

-- Buscar noticias por tag
SELECT * FROM news_posts 
WHERE 'World Tour' = ANY(tags) 
ORDER BY published_date DESC;

-- Obtener estadísticas del sistema
SELECT 
    (SELECT COUNT(*) FROM songs) as total_songs,
    (SELECT COUNT(*) FROM news_posts) as total_news,
    (SELECT COUNT(*) FROM news_categories) as total_categories,
    (SELECT COUNT(*) FROM news_tags) as total_tags,
    (SELECT COUNT(*) FROM news_posts WHERE is_featured = true) as featured_news;
*/

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================

/*
BUCKETS DE SUPABASE STORAGE NECESARIOS:
1. "songs" - Para archivos MP3 (ya existe)
2. "covers" - Para imágenes de portadas de canciones y noticias

CONFIGURACIÓN DE ALMACENAMIENTO:
- Los archivos de audio van en: songs/{song_id}.mp3
- Las portadas de canciones van en: covers/{song_id}.{ext}
- Las imágenes de noticias van en: covers/news/{post_id}.{ext}

VARIABLES DE ENTORNO NECESARIAS:
- SUPABASE_URL: URL de tu proyecto Supabase
- SUPABASE_SERVICE_KEY: Service role key (NO anon key)

ENDPOINTS API IMPLEMENTADOS:
- GET /news - Listar noticias (con filtros opcionales)
- GET /news/{id} - Obtener noticia específica
- POST /news - Crear nueva noticia (con imagen opcional)
- PATCH /news/{id} - Actualizar noticia
- DELETE /news/{id} - Eliminar noticia
- GET /news/categories - Listar categorías
- POST /news/categories - Crear categoría
- GET /news/tags - Listar tags
- POST /news/tags - Crear tag

CARACTERÍSTICAS IMPLEMENTADAS:
✅ Sistema de categorías con colores e iconos
✅ Tags múltiples por noticia
✅ Noticias destacadas
✅ Subida de imágenes
✅ Filtrado por categoría y featured
✅ Búsqueda y ordenamiento
✅ Interfaz React completa con modal
✅ Diseño responsive y premium
✅ Integración con navegación existente
✅ Datos reales de investigación sobre Ado
*/