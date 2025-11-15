const firebaseConfig = {
  apiKey: "AIzaSyCuZnIyvTIvoNknjQVzHyyYWojZe3wl1F8",
  authDomain: "gaucha-6c9c3.firebaseapp.com",
  projectId: "gaucha-6c9c3",
  storageBucket: "gaucha-6c9c3.firebasestorage.app",
  messagingSenderId: "952823415131",
  appId: "1:952823415131:web:6f470306953596af285a7e",
  measurementId: "G-JQW163LB7S"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    try {
        await auth.signInWithEmailAndPassword(email, pass);
        window.location.href = "admin.html";
    } catch (err) {
        document.getElementById("loginError").style.display = "block";
        console.error(err);
    }
});

// Si ya está logueado → ir directo al admin
auth.onAuthStateChanged((user)=>{
    if(user){
        window.location.href = "admin.html";
    }
});
