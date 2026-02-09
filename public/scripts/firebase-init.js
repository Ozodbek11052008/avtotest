// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4zQikW0JcAw0-mwijKBZ_qCw67s9c8qE",
  authDomain: "avtotest-3d00b.firebaseapp.com",
  databaseURL: "https://avtotest-3d00b-default-rtdb.firebaseio.com",
  projectId: "avtotest-3d00b",
  storageBucket: "avtotest-3d00b.firebasestorage.app",
  messagingSenderId: "629285982762",
  appId: "1:629285982762:web:a7848eec016774d380a953",
  measurementId: "G-0TP7XWX03R"
};
// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
let realtimeDb;

try {
  realtimeDb = firebase.database();
  console.log("Firebase Realtime Database initialized");
} catch (error) {
  console.error("Error initializing Realtime Database:", error);
  setTimeout(function () {
    try {
      realtimeDb = firebase.database();
      window.realtimeDb = realtimeDb;
      console.log("Firebase Realtime Database initialized (retry)");
    } catch (retryError) {
      console.error("Failed to initialize Realtime Database after retry:", retryError);
    }
  }, 1000);
}

// Hardcoded admin credentials (CHANGE THESE!)


// Global access
window.auth = auth;
window.db = db;
window.realtimeDb = realtimeDb;

console.log("Firebase initialized", {
  auth: !!auth,
  db: !!db,
  realtimeDb: !!realtimeDb
});