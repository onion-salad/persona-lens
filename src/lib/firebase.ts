// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// ★ IMPORTANT: Replace with your actual config values. Consider using environment variables for security.
const firebaseConfig = {
  apiKey: "AIzaSyD5jXyS4ckMnMIGt0YI7WWQP1xjqJ1fGZg", // ★ Replace with your actual API key
  authDomain: "personalens-5c5e1.firebaseapp.com",
  projectId: "personalens-5c5e1",
  storageBucket: "personalens-5c5e1.appspot.com", // ★ Verify this in your Firebase console
  messagingSenderId: "984135633450",
  appId: "1:984135633450:web:274f7f5e6557835fd7d153",
  measurementId: "G-Y1N7FHF0DD"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app); // 必要に応じてリージョンを指定: getFunctions(app, 'asia-northeast1') など

let analytics;
// Analytics はブラウザ環境でのみサポートされているか確認
isAnalyticsSupported().then((isSupported) => {
  if (isSupported) {
    analytics = getAnalytics(app);
    console.log("Firebase Analytics initialized."); // 確認用ログ
  }
});

export { app, auth, db, functions, analytics }; 