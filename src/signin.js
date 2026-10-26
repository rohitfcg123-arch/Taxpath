import "./style.css";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";

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
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });
const button = document.getElementById("continueGoogle");
const message = document.getElementById("signinMessage");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}
function goHome() {
  window.location.replace(new URL("index.html", window.location.href).href);
}

onAuthStateChanged(auth, user => {
  if (user) {
    showMessage("Signed in as " + (user.displayName || user.email || "Google user") + ". Returning to TaxPath…");
    goHome();
  }
});

getRedirectResult(auth).catch(error => {
  console.error("TaxPath redirect sign-in failed:", error);
  showMessage("Google sign-in could not be completed. Please try again.", true);
});

async function startGoogleSignIn() {
  button.disabled = true;
  showMessage("Opening Google sign-in…");
  try {
    const result = await signInWithPopup(auth, provider);
    try {
      if (await isSupported()) {
        const analytics = getAnalytics(app);
        logEvent(analytics, "login", { method: "google" });
      }
    } catch (analyticsError) {
      console.info("Analytics unavailable.", analyticsError);
    }
    showMessage("Signed in successfully. Returning to TaxPath…");
    if (result.user) goHome();
  } catch (error) {
    console.error("TaxPath Google sign-in failed:", error);
    if (error.code === "auth/popup-blocked") {
      try {
        await signInWithRedirect(auth, provider);
        return;
      } catch (redirectError) {
        console.error("TaxPath redirect fallback failed:", redirectError);
      }
    }
    const messages = {
      "auth/operation-not-allowed": "Google sign-in is not enabled in Firebase Authentication.",
      "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
      "auth/popup-closed-by-user": "Sign-in was cancelled. Tap the button to try again.",
      "auth/network-request-failed": "Network error. Check your internet connection and try again."
    };
    showMessage(messages[error.code] || "Google sign-in failed. Check your Firebase settings and try again.", true);
    button.disabled = false;
  }
}
window.taxPathGoogleSignIn = startGoogleSignIn;
button.addEventListener("click", startGoogleSignIn);
