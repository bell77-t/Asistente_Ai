const admin = require('firebase-admin');
const path = require('node:path');

if (!admin.apps.length) {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebaseKey.json';
  const serviceAccount = require(path.resolve(__dirname, '..', credentialsPath));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = {
  admin,
  db,
};
