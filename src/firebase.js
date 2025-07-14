// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBOdl2jwc3bafLFx6wuRSeZEHD063wBjzk",
    authDomain: "flatmate-2fbf3.firebaseapp.com",
    databaseURL: 'https://flatmate-2fbf3-default-rtdb.firebaseio.com',
    projectId: "flatmate-2fbf3",
    storageBucket: "flatmate-2fbf3.firebasestorage.app",
    messagingSenderId: "481326667390",
    appId: "1:481326667390:web:ab80def5f47a7933d3ea2f",
    measurementId: "G-PZRTJ8YV43",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Realtime Database
export const db = getDatabase(app);
// Email and Password Auth
export const auth = getAuth(app);