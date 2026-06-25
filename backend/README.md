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

## Despliegue en Render

1. Conecta este repositorio a Render.
2. Render detectara el archivo `render.yaml` y creara el servicio web del backend.
3. En la pestaña de Environment Variables del servicio agrega:
   - `GEMINI_API_KEY`: tu clave de Gemini.
   - `FIREBASE_SERVICE_ACCOUNT`: el contenido JSON completo del service account de Firebase.
4. Haz deploy y espera a que Render complete el build.
5. La URL final sera algo como `https://<nombre-del-servicio>.onrender.com`.
