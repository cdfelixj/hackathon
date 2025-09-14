const admin = require('firebase-admin');

let db = null;

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('🔥 Firebase already initialized');
      db = admin.firestore();
      return;
    }

    // Validate required environment variables
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
    }

    // Initialize Firebase Admin SDK
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    // Initialize Firestore
    db = admin.firestore();
    
    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
    });

    console.log('🔥 Firebase initialized successfully');
    console.log(`📊 Connected to Firestore project: ${process.env.FIREBASE_PROJECT_ID}`);

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
}

/**
 * Get Firestore database instance
 * @returns {FirebaseFirestore.Firestore} Firestore database instance
 */
function getDb() {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
}

/**
 * Get Firebase Auth instance
 * @returns {admin.auth.Auth} Firebase Auth instance
 */
function getAuth() {
  return admin.auth();
}

/**
 * Validate Firebase connection
 * @returns {Promise<boolean>} True if connection is valid
 */
async function validateConnection() {
  try {
    const db = getDb();
    // Try to read from a test collection
    await db.collection('_health_check').doc('test').get();
    return true;
  } catch (error) {
    console.error('Firebase connection validation failed:', error.message);
    return false;
  }
}

/**
 * Collection references for easy access
 */
const Collections = {
  USER_PREFERENCES: 'user_preferences',
  AREA_CACHE: 'area_cache',
  POPULAR_AREAS: 'popular_areas',
  ANALYTICS: 'analytics'
};

module.exports = {
  initializeFirebase,
  getDb,
  getAuth,
  validateConnection,
  Collections,
  admin
};
