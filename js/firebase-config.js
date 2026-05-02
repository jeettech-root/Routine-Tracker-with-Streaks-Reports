import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
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
const routineDocRef = doc(db, "routineTracker", "default");

window.FirebaseServices = {
  app,
  db,
  async loadTasks() {
    const snapshot = await getDoc(routineDocRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return Array.isArray(data.tasks) ? data.tasks : [];
  },
  async saveTasks(tasks) {
    await setDoc(
      routineDocRef,
      {
        tasks,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },
};
