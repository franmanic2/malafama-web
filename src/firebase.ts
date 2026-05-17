import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDHuKP6IUSpX-lQBsa7Mx6RmwvXlEPG3Pw",
  authDomain: "malafama-web-f3c1d.firebaseapp.com",
  projectId: "malafama-web-f3c1d",
  storageBucket: "malafama-web-f3c1d.firebasestorage.app",
  messagingSenderId: "184633377090",
  appId: "1:184633377090:web:982d028695995dd19cc8db"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
