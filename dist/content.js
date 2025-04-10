// Content script for LeetCode editor integration
console.log('LeetCode Snippeter: Content script loaded');

let snippets = [];
let suggestionBox = null;
let currentWord = '';

// Inject script into page context
function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => {
    script.remove();
  };
}

// Send message to injected script
function sendToInjected(action, data) {
  window.postMessage({
    type: 'LEETCODE_SNIPPETER',
    action,
    data
  }, '*');
}

// Listen for messages from injected script
window.addEventListener('message', (event) => {
  if (event.data.type !== 'LEETCODE_SNIPPETER_RESPONSE') return;
  
  switch (event.data.action) {
    case 'CURRENT_WORD':
      if (event.data.data) {
        currentWord = event.data.data.word;
        showSuggestions(currentWord, event.data.data.position);
      } else {
        // Hide suggestion box if no word is found
        if (suggestionBox) {
          suggestionBox.style.display = 'none';
        }
      }
      break;
  }
});

// Load snippets from storage
function loadSnippets() {
  console.log('LeetCode Snippeter: Loading snippets from storage');
  chrome.storage.local.get('snippets', (result) => {
    if (chrome.runtime.lastError) {
      console.error('LeetCode Snippeter: Error loading snippets:', chrome.runtime.lastError);
      return;
    }
    snippets = result.snippets || [];
    console.log('LeetCode Snippeter: Loaded snippets:', snippets);
  });
}

// Listen for storage changes
function setupStorageListener() {
  console.log('LeetCode Snippeter: Setting up storage listener');
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.snippets) {
      snippets = changes.snippets.newValue || [];
      console.log('LeetCode Snippeter: Snippets updated:', snippets);
    }
  });
}

// Create suggestion box element
function createSuggestionBox() {
  console.log('LeetCode Snippeter: Creating suggestion box');
  const box = document.createElement('div');
  box.className = 'leetcode-snippeter-suggestion-box';
  box.style.cssText = `
    position: absolute;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    max-height: 200px;
    overflow-y: auto;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    display: none;
    padding: 4px;
    min-width: 150px;
    max-width: 300px;
  `;
  return box;
}

// Insert snippet into editor
function insertSnippet(snippet) {
  if (!snippet || typeof snippet.code !== 'string') {
    console.error('LeetCode Snippeter: snippetText is not valid:', snippet);
    return;
  }

  sendToInjected('INSERT_SNIPPET', {
    snippet: snippet.code  // FIXED this line
  });

  if (suggestionBox) {
    suggestionBox.style.display = 'none';
  }
}



// Show suggestions based on current word
function showSuggestions(word, position) {
  if (!word || !snippets || snippets.length === 0) {
    if (suggestionBox) {
      suggestionBox.style.display = 'none';
    }
    return;
  }

  const matchingSnippets = snippets.filter(s => 
    s.title.toLowerCase().startsWith(word.toLowerCase())
  );

  if (matchingSnippets.length === 0) {
    if (suggestionBox) {
      suggestionBox.style.display = 'none';
    }
    return;
  }

  if (!suggestionBox) {
    suggestionBox = createSuggestionBox();
    document.body.appendChild(suggestionBox);
  }

  // Position the box near the cursor
  const editorElement = document.querySelector('.monaco-editor');
  if (editorElement && position) {
    const editorRect = editorElement.getBoundingClientRect();
    const lineHeight = 19; // Default Monaco editor line height
    const charWidth = 8; // Approximate character width
    
    // Calculate position based on line and column
    const top = editorRect.top + ((position.lineNumber - 1) * lineHeight);
    const left = editorRect.left + (position.column * charWidth);
    
    // Ensure the box stays within viewport
    suggestionBox.style.left = `${Math.min(left, window.innerWidth - 300)}px`;
    suggestionBox.style.top = `${top + lineHeight + 5}px`; // Place below the current line
  }

  // Show matching snippets
  suggestionBox.innerHTML = matchingSnippets.map((snippet, index) => `
    <div class="suggestion-item" data-index="${index}">
      <div class="snippet-title">${snippet.title}</div>
    </div>
  `).join('');

  suggestionBox.style.display = 'block';

  // Add styles for suggestion items
  const styleId = 'leetcode-snippeter-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .suggestion-item {
        padding: 6px 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: 4px;
        margin: 2px;
      }
      .suggestion-item:hover {
        background-color: #f0f0f0;
      }
      .snippet-title {
        font-size: 13px;
        color: #333;
      }
    `;
    document.head.appendChild(style);
  }

  suggestionBox.querySelectorAll('.suggestion-item').forEach((item) => {
    item.addEventListener('click', () => {
      const index = parseInt(item.getAttribute('data-index'));
      const snippet = matchingSnippets[index];
      insertSnippet(snippet);
    });
  });

  
}

// Setup editor integration
function setupEditorIntegration() {
  console.log('LeetCode Snippeter: Setting up editor integration');

  // Inject our helper script
  injectScript();

  // Listen for keyup events
  document.addEventListener('keyup', (event) => {
    // Only trigger for alphanumeric keys, space, and backspace
    if (!/^[a-zA-Z0-9\s]$/.test(event.key) && event.key !== 'Backspace') {
      return;
    }

    const editorElement = event.target.closest('.monaco-editor');
    if (!editorElement) return;

    // Request current word from injected script
    sendToInjected('GET_CURRENT_WORD');
  });

  // Add click listener to document to hide suggestions
  document.addEventListener('click', (event) => {
    if (suggestionBox && !suggestionBox.contains(event.target)) {
      suggestionBox.style.display = 'none';
    }
  });

  console.log('LeetCode Snippeter: Editor integration setup completed');
}

// Initialize
console.log('LeetCode Snippeter: Initializing content script');
loadSnippets();
setupStorageListener();
setupEditorIntegration();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SNIPPETS') {
    sendResponse({ snippets });
  }
});