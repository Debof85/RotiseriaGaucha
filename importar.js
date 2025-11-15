import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from "fs";

// 1. LEER ARCHIVO JSON
const rawData = fs.readFileSync("./productos.json", "utf-8");
const data = JSON.parse(rawData);

// 2. CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCuZnIyvTIvoNknjQVzHyyYWojZe3wl1F8",
  authDomain: "gaucha-6c9c3.firebaseapp.com",
  projectId: "gaucha-6c9c3",
  storageBucket: "gaucha-6c9c3.firebasestorage.app",
  messagingSenderId: "952823415131",
  appId: "1:952823415131:web:6f470306953596af285a7e",
  measurementId: "G-JQW163LB7S"
};no

// 3. INICIALIZAR FIREBASE
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importar() {
  try {
    for (const producto of data) {
      await addDoc(collection(db, "productos"), producto);
      console.log("✔️ Subido:", producto.nombre);
    }
    console.log("🎉 IMPORTACIÓN COMPLETADA");
  } catch (e) {
    console.error("❌ Error:", e);
  }
}

importar();