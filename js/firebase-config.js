import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCDAuPPdZ2rDcyhQUiF1ftFZbrqlFMpLvA",
  authDomain: "routinetracker-e3e38.firebaseapp.com",
  projectId: "routinetracker-e3e38",
  storageBucket: "routinetracker-e3e38.firebasestorage.app",
  messagingSenderId: "587566712255",
  appId: "1:587566712255:web:99d9cd3abb7f8d4e110d0a",
  measurementId: "G-V74KDP3ED1",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function getUserDocRef(userId) {
  return doc(db, "routineTrackerUsers", userId);
}

function getUserPayload(user) {
  if (!user) return null;
  return {
    id: user.uid,
    name: user.email || user.displayName || "Signed in user",
    email: user.email || "",
  };
}

window.FirebaseServices = {
  app,
  db,
  auth,
  getCurrentUser() {
    return getUserPayload(auth.currentUser);
  },
  onAuthChange(callback) {
    return onAuthStateChanged(auth, (user) => {
      callback(getUserPayload(user));
    });
  },
  async register(email, password) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return getUserPayload(credential.user);
  },
  async signIn(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return getUserPayload(credential.user);
  },
  async signOut() {
    await firebaseSignOut(auth);
  },
  async loadTasks(userId) {
    if (!userId) return null;
    const snapshot = await getDoc(getUserDocRef(userId));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return Array.isArray(data.tasks) ? data.tasks : [];
  },
  async saveTasks(tasks, user) {
    if (!user || !user.id) return;
    await setDoc(
      getUserDocRef(user && user.id),
      {
        tasks,
        userId: user && user.id,
        userName: user && user.name,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },
};
