// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from "firebase/database"; 

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDzf8Ssdg6VCIKG5SKL4mTJkXx56l6THfs",
  authDomain: "tpchat-bb1cc.firebaseapp.com",
  projectId: "tpchat-bb1cc",
  storageBucket: "tpchat-bb1cc.appspot.com",
  messagingSenderId: "43338551866",
  appId: "1:43338551866:web:d7c31cfdabe8d572745b03",
  measurementId: "G-PHS3YWW6C2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const database = getDatabase(app); 

export { app, db, storage, database };