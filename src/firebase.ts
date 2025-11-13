// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCwmJ1thEU9nD1BkQP94f06JgrFPHnekdw",
  authDomain: "calcular-precios.firebaseapp.com",
  projectId: "calcular-precios",
  storageBucket: "calcular-precios.firebasestorage.app",
  messagingSenderId: "203725649962",
  appId: "1:203725649962:web:92a232d7734e7f153c2b53",
  measurementId: "G-8BVY5QBSJL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
