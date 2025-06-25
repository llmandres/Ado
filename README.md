# API TODO – Plantilla de arranque

Este pequeño proyecto incluye:

* **Backend**: Python 3 + FastAPI (`backend/`)
* **Frontend**: HTML / JS vanilla (`frontend/`)

## Requisitos

* Python ≥ 3.8
* (Opcional) Git

## Puesta en marcha

```bash
# 1. Clona o descarga el repositorio y entra en la carpeta raíz
cd Ado

# 2. Crea un entorno virtual (Windows)
python -m venv venv
venv\Scripts\activate

#    macOS / Linux
#    python3 -m venv venv
#    source venv/bin/activate

# 3. Instala dependencias
pip install -r requirements.txt

# 4. Lanza el servidor en modo autoreload
uvicorn backend.main:app --reload
```

Ve a <http://127.0.0.1:8000/docs> para probar la API con Swagger.

## Visualizar el frontend

Abre `frontend/index.html` con tu navegador preferido. Si hospedas el frontend en un servidor distinto, recuerda ajustar `allow_origins` en `backend/main.py`.

## Frontend React con Vite

```bash
# 1. Instalar dependencias (primera vez)
cd frontend
npm install

# 2. Ejecutar en desarrollo
npm run dev    # abre <http://localhost:5173>

# 3. Compilar para producción
npm run build  # genera dist/
```

Recuerda mantener el backend activo (`uvicorn backend.main:app --reload`) mientras trabajas en el frontend.

---

¡Ahora sólo te queda **picar código**! Añade nuevas rutas, conecta una base de datos real o moderniza el frontend con React, Vue o tu framework favorito. 