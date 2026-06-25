const admin = require('firebase-admin');
const path = require('node:path');

for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) {
  if (process.env[key]?.includes('127.0.0.1:9')) {
    delete process.env[key];
  }
}

if (!admin.apps.length) {
  try {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebaseKey.json';
    const fullPath = path.resolve(__dirname, '..', credentialsPath);
    
    console.log("Iniciando Firebase. Buscando credenciales en:", fullPath);
    
    const serviceAccount = require(fullPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase inicializado correctamente.");
    
  } catch (error) {
    console.error("¡ERROR CRÍTICO AL INICIAR FIREBASE! Verifica la ruta del archivo JSON.");
    console.error(error.message);
  }
}

const db = admin.firestore();

module.exports = {
  admin,
  db,
};
