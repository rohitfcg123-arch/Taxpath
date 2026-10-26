import "./style.css";
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

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
try { if (await isSupported()) getAnalytics(app); } catch (e) { console.info("Analytics unavailable in this environment.", e); }

const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
function calculate(p,r,y){const n=Math.round(y*12);if(!(p>0)||!(n>0)||r<0)return{emi:0,total:0,interest:0};const m=r/1200;const emi=m===0?p/n:p*m*Math.pow(1+m,n)/(Math.pow(1+m,n)-1);const total=emi*n;return{emi,total,interest:total-p};}
function update(source){const suffix=source==="hero"?"":"2";const p=Number(document.getElementById("amount"+suffix).value),r=Number(document.getElementById("rate"+suffix).value),y=Number(document.getElementById("years"+suffix).value);if(!(p>0)||r<0||r>40||!(y>0)||y>40)return;const x=calculate(p,r,y);document.getElementById("emi"+(suffix||"")).textContent=money(x.emi);if(suffix==="2"){document.getElementById("interest").textContent=money(x.interest);document.getElementById("repay").textContent=money(x.total);}else{document.getElementById("total").textContent="Total repayment: "+money(x.total);}}
["amount","rate","years"].forEach(id=>document.getElementById(id).addEventListener("input",()=>update("hero")));
["amount2","rate2","years2"].forEach(id=>document.getElementById(id).addEventListener("input",()=>update("main")));
document.getElementById("menu").addEventListener("click",()=>document.getElementById("nav").classList.toggle("open"));
document.getElementById("year").textContent=new Date().getFullYear();
update("hero");update("main");