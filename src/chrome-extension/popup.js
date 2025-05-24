 document.addEventListener('DOMContentLoaded', () => {
  const titleInput = document.getElementById('snippet-title');
  const codeInput = document.getElementById('snippet-code');
  const saveButton = document.getElementById('save-snippet');
  const searchInput = document.getElementById('search-snippets');
  const snippetsList = document.getElementById('snippets-list');

   function loadSnippets() {
    chrome.storage.local.get(['snippets'], (result) => {
      const snippets = result.snippets || [];
      displaySnippets(snippets);
    });
  }
function displaySnippets(snippets, searchTerm = '') {
    snippetsList.innerHTML = '';
    
    const filteredSnippets = searchTerm
      ? snippets.filter(snippet => 
          snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          snippet.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : snippets;

    filteredSnippets.forEach((snippet, index) => {
      const snippetElement = createSnippetElement(snippet, index);
      snippetsList.appendChild(snippetElement);
    });
  }

  function createSnippetElement(snippet, index) {
    const div = document.createElement('div');
    div.className = 'snippet-item';
    div.innerHTML = `
      <div class="snippet-header">
        <span class="snippet-title">${snippet.title}</span>
        <div class="snippet-actions">
          <button class="copy-btn">Copy</button>
          <button class="delete-btn">Delete</button>
          <button class="expand-btn">Expand</button>
        </div>
      </div>
      <div class="snippet-code">${snippet.code}</div>
    `;

    const copyBtn = div.querySelector('.copy-btn');
    const deleteBtn = div.querySelector('.delete-btn');
    const expandBtn = div.querySelector('.expand-btn');

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(snippet.code);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 2000);
    });

    deleteBtn.addEventListener('click', () => {
      chrome.storage.local.get(['snippets'], (result) => {
        const snippets = result.snippets || [];
        snippets.splice(index, 1);
        chrome.storage.local.set({ snippets }, () => {
          loadSnippets();
        });
      });
    });

    expandBtn.addEventListener('click', () => {
      div.classList.toggle('expanded');
      expandBtn.textContent = div.classList.contains('expanded') ? 'Collapse' : 'Expand';
    });

    return div;
  }

  // Save new snippet
  saveButton.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const code = codeInput.value.trim();

    if (!title || !code) {
      alert('Please enter both title and code');
      return;
    }

    chrome.storage.local.get(['snippets'], (result) => {
      const snippets = result.snippets || [];
      snippets.push({ title, code });
      chrome.storage.local.set({ snippets }, () => {
        titleInput.value = '';
        codeInput.value = '';
        loadSnippets();
      });
    });
  });

  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    chrome.storage.local.get(['snippets'], (result) => {
      const snippets = result.snippets || [];
      displaySnippets(snippets, searchTerm);
    });
  });

  
  loadSnippets();
}); 