const admin = require('firebase-admin');
const path = require('node:path');

for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) {
  if (process.env[key]?.includes('127.0.0.1:9')) {
    delete process.env[key];
  }
}

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    
    // Si la cadena está en base64 la decodificamos, si es JSON plano lo dejamos tal cual
    const isJson = raw.startsWith('{');
    const jsonString = isJson ? raw : Buffer.from(raw, 'base64').toString('utf8');

    // Limpieza profunda y estricta de caracteres de control para evitar el SyntaxError
    const sanitized = jsonString
      .replace(/\\n/g, '\n')
      .replace(/\r/g, '')
      .replace(/[\u0000-\u0019]+/g, ""); 

    return JSON.parse(sanitized);
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebaseLLave.json';
  return require(path.resolve(__dirname, '..', credentialsPath));
}

if (!admin.apps.length) {
  const serviceAccount = getServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = {
  admin,
  db,
};
