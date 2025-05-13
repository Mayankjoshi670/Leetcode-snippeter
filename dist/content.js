// Content script for LeetCode editor integration
console.log('LeetCode Snippeter: Content script loaded');

let snippets = [];
let suggestionBox = null;
let currentWord = '';
let sideWindow = null;
let sideWindowButton = null;

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

// Create side window button
function createSideWindowButton() {
  console.log('LeetCode Snippeter: Creating side window button');
  const button = document.createElement('button');
  button.className = 'leetcode-snippeter-side-button';
  button.innerHTML = 'Snippets';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #1a90ff;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 999999;
    transition: all 0.2s ease;
  `;
  
  // Add hover effect
  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#0078e7';
    button.style.transform = 'translateY(-2px)';
  });
  
  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#1a90ff';
    button.style.transform = 'translateY(0)';
  });
  
  // Add click handler
  button.addEventListener('click', toggleSideWindow);
  
  return button;
}

// Create side window
function createSideWindow() {
  console.log('LeetCode Snippeter: Creating side window');
  const window = document.createElement('div');
  window.className = 'leetcode-snippeter-side-window';
  window.style.cssText = `
    position: fixed;
    top: 0;
    right: -300px;
    width: 300px;
    height: 100vh;
    background-color: white;
    box-shadow: -2px 0 10px rgba(0,0,0,0.1);
    z-index: 999998;
    transition: right 0.3s ease;
    display: flex;
    flex-direction: column;
  `;
  
  // Create header
  const header = document.createElement('div');
  header.className = 'leetcode-snippeter-side-header';
  header.style.cssText = `
    padding: 16px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'LeetCode Snippeter';
  title.style.cssText = `
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  `;
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    color: #666;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  `;
  closeButton.addEventListener('click', toggleSideWindow);
  
  header.appendChild(title);
  header.appendChild(closeButton);
  
  // Create content
  const content = document.createElement('div');
  content.className = 'leetcode-snippeter-side-content';
  content.style.cssText = `
    padding: 16px;
    flex: 1;
    overflow-y: auto;
  `;
  
  const greeting = document.createElement('div');
  greeting.textContent = 'Hi there!';
  greeting.style.cssText = `
    font-size: 24px;
    font-weight: 600;
    color: #1a90ff;
    margin-bottom: 16px;
    text-align: center;
  `;
  
  content.appendChild(greeting);
  
  // Add snippets list
  const snippetsList = document.createElement('div');
  snippetsList.className = 'leetcode-snippeter-snippets-list';
  snippetsList.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;
  
  // Add snippets to the list
  snippets.forEach(snippet => {
    const snippetItem = document.createElement('div');
    snippetItem.className = 'leetcode-snippeter-snippet-item';
    snippetItem.style.cssText = `
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    const snippetTitle = document.createElement('div');
    snippetTitle.textContent = snippet.title;
    snippetTitle.style.cssText = `
      font-weight: 500;
      margin-bottom: 4px;
    `;
    
    const snippetPreview = document.createElement('div');
    snippetPreview.textContent = snippet.code.substring(0, 50) + (snippet.code.length > 50 ? '...' : '');
    snippetPreview.style.cssText = `
      font-size: 12px;
      color: #666;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      white-space: pre-wrap;
      overflow: hidden;
    `;
    
    snippetItem.appendChild(snippetTitle);
    snippetItem.appendChild(snippetPreview);
    
    // Add click handler
    snippetItem.addEventListener('click', () => {
      insertSnippet(snippet);
    });
    
    // Add hover effect
    snippetItem.addEventListener('mouseover', () => {
      snippetItem.style.backgroundColor = '#f8f9fa';
      snippetItem.style.transform = 'translateY(-2px)';
    });
    
    snippetItem.addEventListener('mouseout', () => {
      snippetItem.style.backgroundColor = 'white';
      snippetItem.style.transform = 'translateY(0)';
    });
    
    snippetsList.appendChild(snippetItem);
  });
  
  content.appendChild(snippetsList);
  
  window.appendChild(header);
  window.appendChild(content);
  
  return window;
}

// Toggle side window
function toggleSideWindow() {
  if (!sideWindow) {
    sideWindow = createSideWindow();
    document.body.appendChild(sideWindow);
  }
  
  if (sideWindow.style.right === '0px') {
    sideWindow.style.right = '-300px';
  } else {
    sideWindow.style.right = '0px';
  }
}

// Insert snippet into editor
function insertSnippet(snippet) {
  if (!snippet || typeof snippet.code !== 'string') {
    console.error('LeetCode Snippeter: snippetText is not valid:', snippet);
    return;
  }

  sendToInjected('INSERT_SNIPPET', snippet.code);

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

  // Add side window button
  sideWindowButton = createSideWindowButton();
  document.body.appendChild(sideWindowButton);

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