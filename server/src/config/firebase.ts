if (process.env.IECA_USE_MEMORY_DB === 'true') {
  module.exports = require('./firebase.memory');
} else {
  const admin = require('firebase-admin');
  const { loadFirebaseServiceAccount } = require('./env');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(loadFirebaseServiceAccount())
    });
  }

  const db = admin.firestore();
  module.exports = { admin, db };
}
