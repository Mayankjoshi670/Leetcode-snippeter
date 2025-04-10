// Content script for LeetCode editor integration
console.log('LeetCode Snippeter: Content script loaded');

let snippets = [];
let isExtensionContextValid = true;
let suggestionBox = null;
let currentSuggestionIndex = -1;

// Function to check if extension context is valid
function checkExtensionContext() {
  try {
    chrome.runtime.getURL('');
    return true;
  } catch (e) {
    console.error('LeetCode Snippeter: Extension context invalid:', e);
    return false;
  }
}

// Load snippets from storage
function loadSnippets() {
  if (!isExtensionContextValid) return;
  
  console.log('LeetCode Snippeter: Loading snippets from storage');
  chrome.storage.local.get(['snippets'], (result) => {
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
  if (!isExtensionContextValid) return;
  
  console.log('LeetCode Snippeter: Setting up storage listener');
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.snippets) {
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
    position: fixed;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    max-height: 300px;
    overflow-y: auto;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    display: none;
    padding: 8px;
    min-width: 200px;
    max-width: 400px;
  `;
  return box;
}

// Show suggestions
function showSuggestions(event) {
  console.log('LeetCode Snippeter: Showing suggestions');
  
  // Don't show if there are no snippets
  if (!snippets || snippets.length === 0) {
    console.log('LeetCode Snippeter: No snippets available');
    return;
  }
  
  if (!suggestionBox) {
    suggestionBox = createSuggestionBox();
    document.body.appendChild(suggestionBox);
  }
  
  // Position the box near the click
  suggestionBox.style.left = `${event.clientX}px`;
  suggestionBox.style.top = `${event.clientY + 20}px`;
  
  // Show all snippets with just titles
  suggestionBox.innerHTML = snippets.map((snippet, index) => `
    <div class="suggestion-item" data-index="${index}">
      <div class="snippet-title">${snippet.title}</div>
      <div class="snippet-preview" style="display: none;">${snippet.code}</div>
    </div>
  `).join('');
  
  suggestionBox.style.display = 'block';
  
  // Add styles for suggestion items
  const style = document.createElement('style');
  style.textContent = `
    .suggestion-item {
      padding: 10px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid #f0f0f0;
      position: relative;
    }
    .suggestion-item:last-child {
      border-bottom: none;
    }
    .suggestion-item:hover {
      background-color: #f8f9fa;
    }
    .snippet-title {
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }
    .snippet-preview {
      position: absolute;
      left: 100%;
      top: 0;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      box-shadow: 4px 4px 12px rgba(0,0,0,0.1);
      padding: 12px;
      margin-left: 8px;
      font-size: 13px;
      color: #666;
      white-space: pre-wrap;
      max-width: 300px;
      z-index: 1000000;
      display: none;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      line-height: 1.4;
    }
    .suggestion-item:hover .snippet-preview {
      display: block;
    }
  `;
  document.head.appendChild(style);
  
  // Add click handlers to suggestion items
  suggestionBox.querySelectorAll('.suggestion-item').forEach((item, index) => {
    item.addEventListener('click', () => {
      const snippet = snippets[index];
      console.log('LeetCode Snippeter: Copying snippet to clipboard:', snippet);
      
      // Copy to clipboard
      navigator.clipboard.writeText(snippet.code).then(() => {
        // Hide suggestion box
        suggestionBox.style.display = 'none';
      });
    });
  });
}

// Function to setup editor integration
function setupEditorIntegration() {
  if (!isExtensionContextValid) return;
  
  console.log('LeetCode Snippeter: Setting up editor integration');
  
  // Find the editor element
  const editorElement = document.querySelector('.monaco-editor');
  if (!editorElement) {
    console.log('LeetCode Snippeter: Editor element not found');
    return;
  }
  
  console.log('LeetCode Snippeter: Found editor element');
  
  // Add click listener to editor
  editorElement.addEventListener('click', showSuggestions);
  
  // Add click listener to document to hide suggestions when clicking outside
  document.addEventListener('click', (event) => {
    if (suggestionBox && !suggestionBox.contains(event.target) && !editorElement.contains(event.target)) {
      suggestionBox.style.display = 'none';
    }
  });
  
  console.log('LeetCode Snippeter: Editor integration setup completed');
}

// Function to detect when editor is loaded
function detectEditor() {
  console.log('LeetCode Snippeter: Starting editor detection');
  
  const observer = new MutationObserver((mutations) => {
    if (!isExtensionContextValid) {
      observer.disconnect();
      return;
    }

    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        const editor = document.querySelector('.monaco-editor');
        if (editor) {
          console.log('LeetCode Snippeter: Editor found in DOM');
          // Wait a bit for editor to be fully initialized
          setTimeout(() => {
            setupEditorIntegration();
          }, 1000);
          observer.disconnect();
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Function to cleanup resources
function cleanup() {
  console.log('LeetCode Snippeter: Cleaning up resources');
  isExtensionContextValid = false;
  if (suggestionBox) {
    suggestionBox.remove();
    suggestionBox = null;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('LeetCode Snippeter: Received message:', request);
  if (request.type === 'GET_SNIPPETS') {
    if (!isExtensionContextValid) {
      sendResponse({ snippets: [] });
      return;
    }
    sendResponse({ snippets });
  }
});

// Initialize
console.log('LeetCode Snippeter: Initializing content script');
loadSnippets();
setupStorageListener();
detectEditor();

// Check extension context periodically
setInterval(() => {
  if (!checkExtensionContext()) {
    cleanup();
  }
}, 5000); 