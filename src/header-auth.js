import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBmQzf513J4QgdL8UR97AiKe_3tmkc3RVs",
  authDomain: "taxpath-a492c.firebaseapp.com",
  projectId: "taxpath-a492c",
  storageBucket: "taxpath-a492c.firebasestorage.app",
  messagingSenderId: "674936074568",
  appId: "1:674936074568:web:0fed0034e2b4e66f6f837d",
  measurementId: "G-MJTHP6P65D"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const button = document.querySelector("header .signin");
if (button) {
  onAuthStateChanged(auth, user => {
    if (!user) {
      button.textContent = "Sign in";
      button.href = "./signin.html";
      button.removeAttribute("aria-label");
      button.onclick = null;
      return;
    }
    const name = user.displayName || user.email || "Signed in";
    button.textContent = name;
    button.href = "#account";
    button.setAttribute("aria-label", name + ". Click to sign out.");
    button.title = "Click to sign out";
    button.onclick = async event => {
      event.preventDefault();
      try {
        await signOut(auth);
        button.textContent = "Sign in";
        button.href = "./signin.html";
      } catch (error) {
        console.error("Could not sign out:", error);
      }
    };
  });
}
