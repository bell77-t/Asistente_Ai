const admin = require('firebase-admin');
const fs = require('node:fs');
const path = require('node:path');

for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) {
  if (process.env[key]?.includes('127.0.0.1:9')) {
    delete process.env[key];
  }
}

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();

    if (!raw) {
      return null;
    }

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
        // Intenta decodificar como base64 si no es JSON válido.
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
      console.warn('[firebase] FIREBASE_SERVICE_ACCOUNT no es un JSON de servicio válido; se continuará sin credenciales.');
    }

    return null;
  }

  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    './firebaseKey.json',
    './firebaseKeys.json',
    './firebaseLLave.json',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolvedPath = path.resolve(__dirname, '..', candidate);

    if (!fs.existsSync(resolvedPath)) {
      continue;
    }

    try {
      const raw = fs.readFileSync(resolvedPath, 'utf8').trim();
      if (!raw) {
        continue;
      }

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

function initializeAdmin() {
  if (admin.apps.length) {
    return;
  }

  try {
    const serviceAccount = getServiceAccount();

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'local-project';
    console.warn('[firebase] No se encontraron credenciales válidas; iniciando Firebase Admin sin credenciales.');
    admin.initializeApp({ projectId });
  } catch (error) {
    console.warn(`[firebase] No se pudo inicializar Firebase Admin: ${error.message}`);

    try {
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'local-project';
      admin.initializeApp({ projectId });
    } catch (fallbackError) {
      console.warn(`[firebase] Fallback de inicialización falló: ${fallbackError.message}`);
    }
  }
}

initializeAdmin();

const db = admin.firestore();

module.exports = {
  admin,
  db,
};
