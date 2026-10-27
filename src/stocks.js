const $ = id => document.getElementById(id);
const searchInput = $("stockSearch"), suggestions = $("stockSuggestions"), statusBox = $("stockStatus"), dashboard = $("stockDashboard");
let matches = [], selected = null, activeRange = "1y", debounce = null, searchController = null, chartController = null;
// GitHub Pages is static, so try several public CORS relays when the data provider blocks browsers.
// For reliability in the search box, a small local catalogue is also available as a fallback.
async function fetchMarketJSON(url, signal){
  const attempts = [
    async()=>{const r=await fetch(url,{signal,headers:{"Accept":"application/json"}});if(!r.ok)throw new Error("Provider HTTP "+r.status);return r.json();},
    async()=>{const r=await fetch("https://api.allorigins.win/raw?url="+encodeURIComponent(url),{signal});if(!r.ok)throw new Error("AllOrigins HTTP "+r.status);return r.json();},
    async()=>{const r=await fetch("https://corsproxy.io/?url="+encodeURIComponent(url),{signal});if(!r.ok)throw new Error("CORS proxy HTTP "+r.status);return r.json();},
    async()=>{const r=await fetch("https://api.codetabs.com/v1/proxy?quest="+encodeURIComponent(url),{signal});if(!r.ok)throw new Error("CodeTabs HTTP "+r.status);return r.json();}
  ];
  let lastError;
  for(const attempt of attempts){try{return await attempt();}catch(e){if(e.name==="AbortError")throw e;lastError=e;}}
  throw new Error("Market data could not be reached from this browser. "+(lastError?.message||"All available sources failed."));
}
const indianStocks = [
 ["Tata Consultancy Services","TCS","TCS.NS","NSE"],["Reliance Industries","RELIANCE","RELIANCE.NS","NSE"],["HDFC Bank","HDFCBANK","HDFCBANK.NS","NSE"],["ICICI Bank","ICICIBANK","ICICIBANK.NS","NSE"],["Infosys","INFY","INFY.NS","NSE"],["State Bank of India","SBIN","SBIN.NS","NSE"],["Bharti Airtel","BHARTIARTL","BHARTIARTL.NS","NSE"],["ITC","ITC","ITC.NS","NSE"],["Larsen & Toubro","LT","LT.NS","NSE"],["Hindustan Unilever","HINDUNILVR","HINDUNILVR.NS","NSE"],["Wipro","WIPRO","WIPRO.NS","NSE"],["Tata Motors","TATAMOTORS","TATAMOTORS.NS","NSE"],["Mahindra & Mahindra","M&M","M&M.NS","NSE"],["Axis Bank","AXISBANK","AXISBANK.NS","NSE"],["Bajaj Finance","BAJFINANCE","BAJFINANCE.NS","NSE"],["Maruti Suzuki India","MARUTI","MARUTI.NS","NSE"],["NTPC","NTPC","NTPC.NS","NSE"],["Power Grid Corporation","POWERGRID","POWERGRID.NS","NSE"],["Adani Enterprises","ADANIENT","ADANIENT.NS","NSE"],["Asian Paints","ASIANPAINT","ASIANPAINT.NS","NSE"],["Titan Company","TITAN","TITAN.NS","NSE"],["Coal India","COALINDIA","COALINDIA.NS","NSE"],["Sun Pharmaceutical","SUNPHARMA","SUNPHARMA.NS","NSE"],["Zomato (Eternal)","ETERNAL","ETERNAL.NS","NSE"],["Tata Steel","TATASTEEL","TATASTEEL.NS","NSE"],["HCL Technologies","HCLTECH","HCLTECH.NS","NSE"],["Kotak Mahindra Bank","KOTAKBANK","KOTAKBANK.NS","NSE"],["BSE Limited","BSE","BSE.NS","NSE"],["National Aluminium Company","NATIONALUM","NATIONALUM.NS","NSE"],["HDFC Life Insurance","HDFCLIFE","HDFCLIFE.NS","NSE"]
].map(([longname,shortname,symbol,exchange])=>({longname,shortname,symbol,exchange,exchDisp:exchange,quoteType:"EQUITY",typeDisp:"Equity"}));
const fmt = (n, opts={}) => Number.isFinite(Number(n)) ? new Intl.NumberFormat("en-IN",{maximumFractionDigits:opts.digits ?? 2, ...opts}).format(Number(n)) : "Not available";
const money = (n, currency="INR") => Number.isFinite(Number(n)) ? new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2}).format(Number(n)) : "Not available";
const safe = v => (v === null || v === undefined || v === "" || !Number.isFinite(v) && typeof v === "number") ? "Not available" : String(v);
function setStatus(message, kind="info"){statusBox.textContent=message;statusBox.className="stock-status "+kind;}
function closeSuggestions(){suggestions.hidden=true;suggestions.innerHTML="";}
function quoteLabel(q){const exchange=(q.exchange||q.exchDisp||"").toUpperCase();return exchange+" · "+(q.symbol||"");}
function findLocalCompanies(query){
  const q=query.trim().toLowerCase();
  if(q.length<1)return [];
  return indianStocks.filter(x=>(x.longname+" "+x.shortname+" "+x.symbol).toLowerCase().includes(q))
    .sort((a,b)=>Number(b.shortname.toLowerCase().startsWith(q)||b.symbol.toLowerCase().startsWith(q))-Number(a.shortname.toLowerCase().startsWith(q)||a.symbol.toLowerCase().startsWith(q)))
    .slice(0,9);
}
function renderSuggestions(items){
  matches=items; suggestions.innerHTML="";
  if(!items.length){closeSuggestions();setStatus("No matching listed stocks found. Try a shorter name or ticker.","warning");return;}
  items.forEach((q,i)=>{const b=document.createElement("button");b.type="button";b.className="stock-suggestion";b.setAttribute("role","option");const left=document.createElement("span");left.className="stock-suggestion-name";left.textContent=q.longname||q.shortname||q.symbol;const sub=document.createElement("small");sub.textContent=quoteLabel(q);const right=document.createElement("span");right.className="stock-suggestion-type";right.textContent=q.typeDisp||"Equity";left.appendChild(sub);b.append(left,right);b.addEventListener("click",()=>chooseStock(i));suggestions.appendChild(b);});
  suggestions.hidden=false;
}
async function searchCompanies(query, auto=false){
  if(searchController)searchController.abort();searchController=new AbortController();
  try{
    const url="https://query1.finance.yahoo.com/v1/finance/search?q="+encodeURIComponent(query)+"&quotesCount=12&newsCount=0&listsCount=0";
    const data=await fetchMarketJSON(url,searchController.signal);
    const all=(data.quotes||[]).filter(q=>q.symbol && /\.(NS|BO)$/i.test(q.symbol) && !/ETF|MUTUALFUND|INDEX/i.test(q.quoteType||""));
    renderSuggestions(all.slice(0,9));
    if(!auto && all.length) setStatus("Choose the correct exchange listing from the suggestions.");
  }catch(e){
    if(e.name==="AbortError")return;
    const local=findLocalCompanies(query);
    if(local.length){renderSuggestions(local);setStatus("Live search is unavailable. Showing built-in matches; live prices may also be unavailable.","warning");}
    else {closeSuggestions();setStatus("Live company search is temporarily unavailable, and no built-in match was found. Try a major Indian listed company or retry later.","error");}
  }
}
function chooseStock(index){selected=matches[index];if(!selected)return;searchInput.value=selected.longname||selected.shortname||selected.symbol;closeSuggestions();loadStock(activeRange);}
function metric(label,value,sub=""){const d=document.createElement("div");d.className="stock-metric";const l=document.createElement("span");l.textContent=label;const v=document.createElement("strong");v.textContent=value;d.append(l,v);if(sub){const s=document.createElement("small");s.textContent=sub;d.append(s);}return d;}
function profileItem(label,value){const d=document.createElement("div");d.className="stock-profile-item";const l=document.createElement("span");l.textContent=label;const v=document.createElement("strong");v.textContent=safe(value);d.append(l,v);return d;}
function svgLine(points,positive){
  const w=760,h=250,pad={l:12,r:12,t:18,b:28};const vals=points.map(p=>p.close);const min=Math.min(...vals),max=Math.max(...vals),span=max-min||1;
  const coords=points.map((p,i)=>({x:pad.l+i*(w-pad.l-pad.r)/Math.max(1,points.length-1),y:pad.t+(max-p.close)/span*(h-pad.t-pad.b)}));
  const path=coords.map((p,i)=>(i?"L":"M")+p.x.toFixed(1)+" "+p.y.toFixed(1)).join(" ");
  const area=path+" L "+coords[coords.length-1].x+" "+(h-pad.b)+" L "+coords[0].x+" "+(h-pad.b)+" Z";
  const color=positive?"#16845b":"#d14f57";
  const ticks=[0,.5,1].map(t=>{const y=pad.t+t*(h-pad.t-pad.b),v=max-t*span;return '<line x1="'+pad.l+'" y1="'+y+'" x2="'+(w-pad.r)+'" y2="'+y+'" stroke="#e8eef3" stroke-dasharray="4 5"/><text x="'+(w-pad.r)+'" y="'+(y-5)+'" text-anchor="end" font-size="11" fill="#74879a">'+money(v).replace(".00","")+'</text>';}).join("");
  const start=new Date(points[0].date).toLocaleDateString("en-IN",{month:"short",year:"2-digit"}),end=new Date(points[points.length-1].date).toLocaleDateString("en-IN",{month:"short",year:"2-digit"});
  return '<svg class="stock-svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Historical stock price chart"><defs><linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+color+'" stop-opacity=".22"/><stop offset="100%" stop-color="'+color+'" stop-opacity=".01"/></linearGradient></defs>'+ticks+'<path d="'+area+'" fill="url(#stockFill)"/><path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><text x="'+pad.l+'" y="'+(h-5)+'" font-size="11" fill="#74879a">'+start+'</text><text x="'+(w-pad.r)+'" y="'+(h-5)+'" text-anchor="end" font-size="11" fill="#74879a">'+end+'</text></svg>';
}
function renderDonut(price,low,high,currency){
  const wrap=$("stockDonut");wrap.innerHTML="";
  if(!Number.isFinite(price)||!Number.isFinite(low)||!Number.isFinite(high)||high<=low){wrap.innerHTML='<div class="stock-empty">52-week high/low data not supplied by source.</div>';$("stockRangeText").textContent="";return;}
  const pct=Math.max(0,Math.min(100,(price-low)/(high-low)*100));const circ=2*Math.PI*48;
  wrap.innerHTML='<div class="stock-donut" style="--donut-pct:'+pct+'%;--donut-color:'+(pct<30?'#d69b38':pct>70?'#16845b':'#3484a5')+'"><div><strong>'+Math.round(pct)+'%</strong><small>of 52-week range</small></div></div>';
  $("stockRangeText").textContent="52-week low "+money(low,currency)+" · high "+money(high,currency);
}
async function loadStock(range=activeRange){
  if(!selected)return;
  activeRange=range;dashboard.hidden=false;
  const company=selected.longname||selected.shortname||selected.symbol;
  setStatus("Opening market chart for "+company+"…");
  $("stockCompanyName").textContent=company;
  $("stockTicker").textContent=selected.symbol;
  $("stockExchange").textContent=(selected.exchDisp||selected.exchange||"Listed market")+" · "+(selected.quoteType||"EQUITY");
  $("stockMonogram").textContent=(selected.shortname||selected.symbol||"₹").trim().charAt(0).toUpperCase();
  const isNse=/\.NS$/i.test(selected.symbol);
  const isBse=/\.BO$/i.test(selected.symbol);
  const tvSymbol=(isNse?"NSE:":isBse?"BSE:":(selected.exchange||"NSE")+":")+selected.symbol.replace(/\.(NS|BO)$/i,"");
  const encodedSymbol=encodeURIComponent(tvSymbol);
  const rangeMap={"1mo":"1","3mo":"3","6mo":"6","1y":"12","5y":"60"};
  const months=rangeMap[range]||"12";
  // Use TradingView's hosted chart widget: no browser-side API key or CORS fetch is required.
  const chartUrl="https://www.tradingview.com/widgetembed/?symbol="+encodedSymbol+"&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=F7FAFC&theme=light&style=1&timezone=Asia%2FKolkata&withdateranges=1&hideideas=1&hidevolume=0&locale=en";
  const chart=$("stockLineChart");
  chart.innerHTML="";
  const frame=document.createElement("iframe");
  frame.title=company+" stock price chart";
  frame.loading="lazy";
  frame.referrerPolicy="origin";
  frame.style.cssText="display:block;width:100%;height:430px;border:0;border-radius:12px;background:#f7fafc";
  frame.src=chartUrl;
  chart.appendChild(frame);
  $("stockChartRange").textContent="Interactive chart · "+tvSymbol;
  $("stockChartSource").textContent="Chart provider: TradingView";
  $("stockPrice").textContent="See live quote ↗";
  $("stockPrice").style.fontSize="clamp(19px,2.5vw,26px)";
  $("stockPrice").onclick=()=>window.open("https://www.tradingview.com/symbols/"+encodeURIComponent(tvSymbol)+"/","_blank","noopener");
  $("stockPrice").style.cursor="pointer";
  const changeEl=$("stockChange");
  changeEl.textContent="Quote and price changes shown in chart";
  changeEl.className="stock-change";
  $("stockAsOf").textContent="Market quote availability depends on TradingView and exchange data permissions.";
  const metrics=$("stockMetrics");metrics.replaceChildren();
  metrics.append(metric("Exchange",selected.exchDisp||selected.exchange||"Not available"),metric("Ticker",selected.symbol),metric("Security type",selected.quoteType||"Equity"),metric("Market data","TradingView chart"),metric("Price history","Interactive"),metric("Currency","INR (expected; verify listing)"));
  renderDonut(NaN,NaN,NaN,"INR");
  const profile=$("stockProfileGrid");profile.replaceChildren();
  profile.append(profileItem("Company / security name",company),profileItem("Ticker / exchange symbol",selected.symbol),profileItem("Exchange",selected.exchDisp||selected.exchange),profileItem("Security type",selected.quoteType||"Equity"),profileItem("Sector","Not available from search result"),profileItem("Industry","Not available from search result"),profileItem("Market price","Open TradingView chart"),profileItem("Legal company records","Verify via MCA master data"));
  $("stockBseLink").href="https://www.bseindia.com/";
  $("stockNseLink").href="https://www.nseindia.com/";
  setStatus("Company selected. The interactive chart is provided by TradingView; legal company details should be verified with MCA.","success");
}
searchInput?.addEventListener("input",()=>{
  const q=searchInput.value.trim();selected=null;clearTimeout(debounce);
  if(q.length<1){closeSuggestions();setStatus("Start typing a company name to explore its available data.");return;}
  // Render local suggestions immediately; never make the dropdown depend on an external API.
  const local=findLocalCompanies(q);
  if(local.length){renderSuggestions(local);setStatus("Select a company below. Live prices and charts require a working market-data connection.","info");}
  else if(q.length>=2){closeSuggestions();setStatus("Searching listed companies…");}
  else {closeSuggestions();}
  if(q.length>=2)debounce=setTimeout(()=>searchCompanies(q,true),450);
});
searchInput?.addEventListener("keydown",e=>{if(e.key==="Escape")closeSuggestions();if(e.key==="Enter"){e.preventDefault();if(matches.length)chooseStock(0);else if(searchInput.value.trim().length>1)searchCompanies(searchInput.value.trim(),false);}});
$("stockSearchBtn")?.addEventListener("click",()=>{
  const q=searchInput.value.trim();
  const local=findLocalCompanies(q);
  if(local.length){renderSuggestions(local);chooseStock(0);return;}
  if(matches.length){chooseStock(0);return;}
  if(q.length>1)searchCompanies(q,false);else setStatus("Enter at least one letter of a company name.","warning");
});
$("stockPeriodButtons")?.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{if(!selected)return;$("stockPeriodButtons").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));loadStock(b.dataset.range);}));
document.addEventListener("click",e=>{if(!e.target.closest(".stock-search-wrap"))closeSuggestions();});
