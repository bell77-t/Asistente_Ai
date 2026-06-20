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

El backend usa Firebase Admin con `backend/firebaseKey.json` y expone la API en `http://localhost:3000/`.
