if (process.env.IECA_USE_MEMORY_DB === 'true') {
  module.exports = require('./firebase.memory');
} else {
  const admin = require('firebase-admin');
  const path = require('path');

  const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath))
    });
  }

  const db = admin.firestore();
  module.exports = { admin, db };
}
