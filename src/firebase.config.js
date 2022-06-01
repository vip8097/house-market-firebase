// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore } from "firebase/firestore"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDySFlmlzH9KqLSHo-Advn7rDAXHdmn2U",
  authDomain: "house-market-d7e83.firebaseapp.com",
  projectId: "house-market-d7e83",
  storageBucket: "house-market-d7e83.appspot.com",
  messagingSenderId: "253699364249",
  appId: "1:253699364249:web:7f2113a33adfb97b0b6f08"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore()