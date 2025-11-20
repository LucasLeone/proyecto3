# Sistema de Reclamos (base)

Stack listo para implementar el MVP: Django REST + MongoDB (PyMongo + JWT) y frontend Vite/React como placeholder. No se usa Postgres en el entorno actual (Django usa SQLite solo para sus metadatos internos).

## Backend
- App `claims` con endpoints iniciales:
  - `POST /api/auth/login/` (JWT).
  - CRUD de Áreas (`/api/areas/`) con regla de no eliminar si hay empleados activos.
  - CRUD de Empleados (`/api/employees/`) y Clientes (`/api/clients/`) con soft-delete y validación de email único.
  - CRUD de Proyectos (`/api/projects/`), solo Admin crea; Clientes ven solo los suyos.
- Config MongoDB principal `claims_main` y base de auditoría reservada `claims_audit` vía `backend/.env.*`.
- JWT configurable con `JWT_SECRET_KEY` y `JWT_ACCESS_TTL_MINUTES`.

## Frontend
- Vite + React 19 con Tailwind; pantalla placeholder en `frontend/src/App.jsx` para empezar a maquetar.

## Infra
- Docker Compose local/producción con servicios: backend, frontend y MongoDB (`mongo:6`). Se retiró Postgres del stack local.
- Ajusta `backend/.env.dev` o `.env.prod` con las URIs de Mongo y secretos antes de levantar los contenedores.

## Puesta en marcha rápida (Docker)
```bash
docker compose -f docker-compose.local.yml up --build
```
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Mongo: mongodb://localhost:27017 (en contenedor `mongo`)

## Desarrollo manual
Backend:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
export MONGODB_MAIN_URI="mongodb://localhost:27017"
python manage.py runserver
```

Frontend:
```bash
cd frontend
npm install
npm run dev -- --host
```

## Próximos pasos sugeridos
- Extender el dominio (reclamos, flujos y auditoría) sobre la base de Mongo.
- Crear componentes y rutas reales en el frontend consumiendo los endpoints.
- Añadir tests e2e/unitarios y pipelines de CI para validar antes de desplegar.
