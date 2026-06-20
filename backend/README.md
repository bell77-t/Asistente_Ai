# Backend

API Node/Express conectada a Firebase Admin y Firestore.

## Configuracion

1. Mantener `firebaseKey.json` en esta carpeta. Es privado y no debe subirse a Git.
2. Copiar `.env.example` a `.env` si quieres cambiar el puerto o la ruta de credenciales.
3. Instalar dependencias:

```bash
npm install
```

4. Ejecutar:

```bash
npm run dev
```

## Endpoints

- `GET /health`: verifica la conexion con Firestore.
- `GET /tasks`: lista tareas desde la coleccion `tasks`.
- `POST /tasks`: crea una tarea con `title` y `description`.
