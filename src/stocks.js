  const profile=$("stockProfileGrid");profile.replaceChildren();
  profile.append(profileItem("Company / security name",company),profileItem("Ticker / exchange symbol",selected.symbol),profileItem("Exchange",selected.exchDisp||selected.exchange),profileItem("Security type",selected.quoteType||"Equity"),profileItem("Sector","Not available from search result"),profileItem("Industry","Not available from search result"),profileItem("Market price","Open TradingView chart"),profileItem("Legal company records","Verify via MCA master data"));
  profile.append(profileItem("Company / security name",company),profileItem("Ticker / exchange symbol",selected.symbol),profileItem("Exchange",selected.exchDisp||selected.exchange),profileItem("Security type",selected.quoteType||"Equity"),profileItem("Sector","Not available from search result"),profileItem("Industry","Not available from search result"),profileItem("Financial statements","Use tabs above"),profileItem("Legal company records","Verify via MCA master data"));
  loadFinancialStatements();
  setStatus("Company selected. Financial statements are displayed in TaxPath when the data source permits access.","success");
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
