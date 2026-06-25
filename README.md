# Asistente AI

Proyecto separado por capas:

- `frontend/`: aplicacion Angular.
- `backend/`: carpeta reservada para la API o servicios del servidor.

## Frontend

```bash
cd frontend
npm install
npm start
```

La aplicacion abre normalmente en `http://localhost:4200/`.

## Backend

```bash
cd backend
npm install
npm run dev
```

El backend usa Firebase Admin y expone la API en `http://localhost:3000` cuando se ejecuta localmente.

Para desplegarlo en Render debe ser un servicio web separado del frontend. Este repositorio incluye `render.yaml` con un servicio llamado `asistente-ai-backend`; si Render conserva ese nombre, la API quedara en:

```text
https://asistente-ai-backend.onrender.com
```

Variables necesarias en Render para el backend:

- `AI_PROVIDER=gemini`
- `GEMINI_MODEL=gemini-2.5-flash-lite`
- `GEMINI_API_KEY`: llave de Gemini.
- `FIREBASE_SERVICE_ACCOUNT`: JSON completo de la cuenta de servicio de Firebase Admin, o el mismo JSON codificado en base64.

Importante: `https://asistente-ai-ur0o.onrender.com` es el frontend. No debe usarse como URL del backend. Si Render genera una URL diferente para la API, actualiza `apiBaseUrl` en `frontend/src/enviroments/enviroments.ts` y vuelve a desplegar el frontend.
