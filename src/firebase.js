import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwWt8MD-pf7xJH8zY9vp6_oUotO1v7P1k",
  authDomain: "day-out-e5d2e.firebaseapp.com",
  projectId: "day-out-e5d2e",
  storageBucket: "day-out-e5d2e.firebasestorage.app",
  messagingSenderId: "72087134747",
  appId: "1:72087134747:web:013396c960770b7a7f4ebe",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);