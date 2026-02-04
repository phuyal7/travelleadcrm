// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore, collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBfHChZp3QeSYi7pOCZ8-p2G63hIxs68rU",
  authDomain: "travelleadcrm.firebaseapp.com",
  databaseURL: "https://travelleadcrm-default-rtdb.firebaseio.com",
  projectId: "travelleadcrm",
  storageBucket: "travelleadcrm.firebasestorage.app",
  messagingSenderId: "55869821135",
  appId: "1:55869821135:web:41b4742971ec0d20f767ba",
  measurementId: "G-WPQS7BKV0G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
