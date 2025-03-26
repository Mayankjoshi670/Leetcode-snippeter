document.addEventListener("DOMContentLoaded",()=>{const p=document.getElementById("snippet-title"),l=document.getElementById("snippet-code"),u=document.getElementById("save-snippet"),m=document.getElementById("search-snippets"),a=document.getElementById("snippets-list");function c(){chrome.storage.local.get(["snippets"],e=>{const s=e.snippets||[];d(s)})}function d(e,s=""){a.innerHTML="",(s?e.filter(n=>n.title.toLowerCase().includes(s.toLowerCase())||n.code.toLowerCase().includes(s.toLowerCase())):e).forEach((n,i)=>{const o=v(n,i);a.appendChild(o)})}function v(e,s){const t=document.createElement("div");t.className="snippet-item",t.innerHTML=`
      <div class="snippet-header">
        <span class="snippet-title">${e.title}</span>
        <div class="snippet-actions">
          <button class="copy-btn">Copy</button>
          <button class="delete-btn">Delete</button>
          <button class="expand-btn">Expand</button>
        </div>
      </div>
      <div class="snippet-code">${e.code}</div>
    `;const n=t.querySelector(".copy-btn"),i=t.querySelector(".delete-btn"),o=t.querySelector(".expand-btn");return n.addEventListener("click",()=>{navigator.clipboard.writeText(e.code),n.textContent="Copied!",setTimeout(()=>{n.textContent="Copy"},2e3)}),i.addEventListener("click",()=>{chrome.storage.local.get(["snippets"],g=>{const r=g.snippets||[];r.splice(s,1),chrome.storage.local.set({snippets:r},()=>{c()})})}),o.addEventListener("click",()=>{t.classList.toggle("expanded"),o.textContent=t.classList.contains("expanded")?"Collapse":"Expand"}),t}u.addEventListener("click",()=>{const e=p.value.trim(),s=l.value.trim();if(!e||!s){alert("Please enter both title and code");return}chrome.storage.local.get(["snippets"],t=>{const n=t.snippets||[];n.push({title:e,code:s}),chrome.storage.local.set({snippets:n},()=>{p.value="",l.value="",c()})})}),m.addEventListener("input",e=>{const s=e.target.value.trim();chrome.storage.local.get(["snippets"],t=>{const n=t.snippets||[];d(n,s)})}),c()});
