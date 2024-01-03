import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { EmailAuthProvider } from "firebase/auth";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// const firebaseConfig = {
// 	apiKey: "AIzaSyCiTxiWzxAOndzpeNyy3TuLeT9bxnM0ra4",
// 	authDomain: "eventtiz.firebaseapp.com",
// 	projectId: "eventtiz",
// 	storageBucket: "eventtiz.appspot.com",
// 	messagingSenderId: "600043838110",
// 	appId: "1:600043838110:web:8e094eec1f41d6c353f98f",
// 	measurementId: "G-25R0S4XSE6",
// };
const firebaseConfig = {
  apiKey: "AIzaSyCIv2kSX3dzvaWTaMv7z-XPZGK3bWtGcEw",
  authDomain: "events-61c0b.firebaseapp.com",
  projectId: "events-61c0b",
  storageBucket: "events-61c0b.appspot.com",
  messagingSenderId: "979765040245",
  appId: "1:979765040245:web:3d2d205fbcae03e84dd43c",
  measurementId: "G-9Z18RCJ4BV",
};

// Initialize Firebase
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const provider = new EmailAuthProvider();
const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { provider, auth, storage };
export default db;
