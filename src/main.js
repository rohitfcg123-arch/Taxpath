import "./style.css";
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBmQzf513J4QgdL8UR97AiKe_3tmkc3RVs",
  authDomain: "taxpath-a492c.firebaseapp.com",
  projectId: "taxpath-a492c",
  storageBucket: "taxpath-a492c.firebasestorage.app",
  messagingSenderId: "674936074568",
  appId: "1:674936074568:web:0fed0034e2b4e66f6f837d",
  measurementId: "G-MJTHP6P65D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });
let analytics = null;
try { if (await isSupported()) analytics = getAnalytics(app); } catch (e) { console.info("Analytics unavailable in this environment.", e); }

const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
function calculate(p,r,y){const n=Math.round(y*12);if(!(p>0)||!(n>0)||r<0)return{emi:0,total:0,interest:0};const m=r/1200;const emi=m===0?p/n:p*m*Math.pow(1+m,n)/(Math.pow(1+m,n)-1);const total=emi*n;return{emi,total,interest:total-p};}
function update(source){const suffix=source==="hero"?"":"2";const p=Number(document.getElementById("amount"+suffix).value),r=Number(document.getElementById("rate"+suffix).value),y=Number(document.getElementById("years"+suffix).value);if(!(p>0)||r<0||r>40||!(y>0)||y>40)return;const x=calculate(p,r,y);document.getElementById("emi"+(suffix||"")).textContent=money(x.emi);if(suffix==="2"){document.getElementById("interest").textContent=money(x.interest);document.getElementById("repay").textContent=money(x.total);}else{document.getElementById("total").textContent="Total repayment: "+money(x.total);}}
["amount","rate","years"].forEach(id=>document.getElementById(id).addEventListener("input",()=>update("hero")));
["amount2","rate2","years2"].forEach(id=>document.getElementById(id).addEventListener("input",()=>update("main")));
document.getElementById("menu").addEventListener("click",()=>document.getElementById("nav").classList.toggle("open"));
document.getElementById("year").textContent=new Date().getFullYear();

const authButton = document.getElementById("googleSignIn");
const authButtonText = document.getElementById("authButtonText");
const authStatus = document.getElementById("authStatus");
authButton.addEventListener("click", async () => {
  if (auth.currentUser) {
    try {
      await signOut(auth);
      authStatus.textContent = "You have signed out.";
      authStatus.classList.add("visible");
    } catch (error) {
      authStatus.textContent = "Could not sign out. Please try again.";
      authStatus.classList.add("visible");
      console.error("TaxPath sign-out failed:", error);
    }
    return;
  }
  authButton.disabled = true;
  authButtonText.textContent = "Opening Google…";
  try {
    const result = await signInWithPopup(auth, provider);
    if (analytics) logEvent(analytics, "login", { method: "google" });
    authStatus.textContent = "Signed in as " + (result.user.displayName || result.user.email || "Google user") + ".";
    authStatus.classList.add("visible");
  } catch (error) {
    console.error("TaxPath Google sign-in failed:", error);
    const messages = {
      "auth/operation-not-allowed": "Google sign-in is not enabled in Firebase Authentication yet.",
      "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
      "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and try again.",
      "auth/popup-closed-by-user": "Sign-in was cancelled."
    };
    authStatus.textContent = messages[error.code] || "Google sign-in failed. Check Firebase Authentication settings and try again.";
    authStatus.classList.add("visible");
  } finally {
    authButton.disabled = false;
    authButtonText.textContent = auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email || "Signed in · Sign out") : "Continue with Google";
  }
});
onAuthStateChanged(auth, user => {
  authButtonText.textContent = user ? ((user.displayName || user.email || "Signed in") + " · Sign out") : "Continue with Google";
  authButton.setAttribute("aria-label", user ? "Sign out of TaxPath" : "Continue with Google");
});
update("hero");update("main");
