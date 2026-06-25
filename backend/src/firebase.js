const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Limpiar variables de proxy (mantenemos tu solución por seguridad)
for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) {
  if (process.env[key]?.includes('127.0.0.1:9')) {
    delete process.env[key];
  }
}

// 2. Función robusta para obtener la cuenta de servicio
function getServiceAccount() {
  // Opción A: Leer desde la variable web de Render (en texto plano o Base64)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    if (!raw) return null;

    const candidates = [raw, raw.replace(/\\n/g, '\n'), raw.replace(/\r/g, '')];

    for (const candidate of candidates) {
      try {
        const sanitized = candidate
          .replace(/\\n/g, '\n')
          .replace(/\r/g, '')
          .replace(/[\u0000-\u0019]+/g, '');

        const parsed = JSON.parse(sanitized);
        if (parsed.client_email && parsed.private_key) {
          return parsed;
        }
      } catch (error) {
        // Intenta decodificar abajo si no es JSON directo
      }
    }

    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      const sanitized = decoded
        .replace(/\\n/g, '\n')
        .replace(/\r/g, '')
        .replace(/[\u0000-\u0019]+/g, '');
      const parsed = JSON.parse(sanitized);

      if (parsed.client_email && parsed.private_key) {
        return parsed;
      }
    } catch (error) {
      console.warn('[firebase] FIREBASE_SERVICE_ACCOUNT no es válido; se continuará sin credenciales.');
    }
    return null;
  }

  // Opción B: Leer el archivo local (Asegúrate de poner firebaseKey.json en la carpeta backend/)
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    './firebaseKey.json',
    './firebaseKeys.json',
    './firebaseLLave.json',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolvedPath = path.resolve(__dirname, '..', candidate);

    if (!fs.existsSync(resolvedPath)) continue;

    try {
      const raw = fs.readFileSync(resolvedPath, 'utf8').trim();
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (parsed.client_email && parsed.private_key) {
        return parsed;
      }
    } catch (error) {
      console.warn(`[firebase] No se pudo leer ${candidate}: ${error.message}`);
    }
  }

  return null;
}

// 3. Inicialización única y segura de Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = getServiceAccount();

    if (serviceAccount) {
      console.log('[firebase] Inicializando con credenciales detectadas (variable web o archivo local).');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'local-project';
      console.warn('[firebase] No se encontraron credenciales válidas; iniciando Firebase Admin sin credenciales.');
      admin.initializeApp({ projectId });
    }
  } catch (error) {
    console.warn(`[firebase] Error crítico al inicializar Firebase Admin: ${error.message}`);
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'local-project';
      admin.initializeApp({ projectId });
    } catch (fallbackError) {
      console.error(`[firebase] Fallback de inicialización falló: ${fallbackError.message}`);
    }
  }
}

const db = admin.firestore();

module.exports = {
  admin,
  db,
};