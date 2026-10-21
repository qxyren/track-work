import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDvCQRDfvdu47lNCvXnndJXfZ81btgmUhY",
  authDomain: "track-work-bd526.firebaseapp.com",
  databaseURL: "https://track-work-bd526-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "track-work-bd526",
  storageBucket: "track-work-bd526.firebasestorage.app",
  messagingSenderId: "212090415578",
  appId: "1:212090415578:web:60ba96e8b0db889d8738e3",
  measurementId: "G-5MJT59VZKL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const googleLogin = document.getElementById("googleLogin");
const message = document.getElementById("message");

if (googleLogin) {
  googleLogin.addEventListener("click", async () => {
    googleLogin.disabled = true;
    googleLogin.innerHTML = "Signing in...";
    if (message) message.textContent = "";

    try {
      await signInWithPopup(auth, provider);
      if (message) {
        message.textContent = "Login successful!";
        message.className = "success";
      }
      window.location.replace("mainpage.html");
    } catch (error) {
      console.error("Google login error:", error);
      if (message) {
        if (error.code === "auth/popup-closed-by-user") {
          message.textContent = "Login cancelled.";
        } else if (error.code === "auth/popup-blocked") {
          message.textContent = "Please allow popups for this website.";
        } else {
          message.textContent = "Google login failed. Please try again.";
        }
        message.className = "error";
      }
      googleLogin.disabled = false;
      googleLogin.innerHTML = `
        <span class="google-icon">G</span>
        <span>Continue with Google</span>
      `;
    }
  });
}
