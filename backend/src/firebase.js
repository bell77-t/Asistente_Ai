const admin = require('firebase-admin');
const path = require('node:path');

for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) {
  if (process.env[key]?.includes('127.0.0.1:9')) {
    delete process.env[key];
  }
}

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    const json = raw.startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8');

    return JSON.parse(json.replace(/\\n/g, '\n'));
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebaseKey.json';
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
