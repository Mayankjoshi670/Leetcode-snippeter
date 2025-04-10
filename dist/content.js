// Content script for LeetCode editor integration
console.log('LeetCode Snippeter: Content script loaded');

let snippets = [];
let suggestionBox = null;
let currentWord = '';
let activeElement = null;

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

// Show suggestions based on current word
function showSuggestions(word, element) {
  if (!word || !snippets || snippets.length === 0 || !element) {
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
  const rect = element.getBoundingClientRect();
  const caretCoords = getCaretCoordinates(element);
  
  suggestionBox.style.left = `${rect.left + caretCoords.left}px`;
  suggestionBox.style.top = `${rect.top + caretCoords.top + 20}px`;

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

  // Add click handlers to suggestion items
  suggestionBox.querySelectorAll('.suggestion-item').forEach((item, index) => {
    item.addEventListener('click', () => {
      const snippet = matchingSnippets[index];
      insertSnippet(snippet, element);
    });
  });
}

// Get caret coordinates in a text element
function getCaretCoordinates(element) {
  const position = getCaretPosition(element);
  const dummy = document.createElement('span');
  const text = element.value || element.textContent;
  
  dummy.style.cssText = getComputedStyle(element).cssText;
  dummy.style.height = 'auto';
  dummy.style.position = 'absolute';
  dummy.style.whiteSpace = 'pre-wrap';
  dummy.textContent = text.substring(0, position);
  
  const span = document.createElement('span');
  span.textContent = text.substring(position) || '.';
  dummy.appendChild(span);
  
  document.body.appendChild(dummy);
  const coordinates = {
    top: span.offsetTop,
    left: span.offsetLeft
  };
  document.body.removeChild(dummy);
  
  return coordinates;
}

// Get caret position in a text element
function getCaretPosition(element) {
  if (element.selectionStart !== undefined) {
    return element.selectionStart;
  }
  if (window.getSelection) {
    element.focus();
    const range = window.getSelection().getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }
  return 0;
}

// Insert snippet into editor
function insertSnippet(snippet, element) {
  if (!element) return;

  const start = getCaretPosition(element) - currentWord.length;
  const text = element.value || element.textContent;
  const newText = text.slice(0, start) + snippet.snippet + text.slice(start + currentWord.length);

  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    element.value = newText;
  } else {
    element.textContent = newText;
  }

  // Hide suggestion box
  if (suggestionBox) {
    suggestionBox.style.display = 'none';
  }

  currentWord = '';
  element.focus();
}

// Setup editor integration
function setupEditorIntegration() {
  console.log('LeetCode Snippeter: Setting up editor integration');

  // Listen for keyup events on the document
  document.addEventListener('keyup', (event) => {
    const element = event.target;
    
    // Check if we're in an editor element
    if (!(element instanceof HTMLTextAreaElement) && 
        !(element instanceof HTMLInputElement) && 
        !element.isContentEditable) {
      return;
    }

    // Store the active element
    activeElement = element;

    // Get the current word
    const text = element.value || element.textContent;
    const position = getCaretPosition(element);
    let wordStart = position;

    // Find the start of the current word
    while (wordStart > 0 && /[\w-]/.test(text[wordStart - 1])) {
      wordStart--;
    }

    currentWord = text.slice(wordStart, position);
    
    // Show suggestions if we have a word
    if (currentWord) {
      showSuggestions(currentWord, element);
    }
  });

  // Add click listener to document to hide suggestions when clicking outside
  document.addEventListener('click', (event) => {
    if (suggestionBox && !suggestionBox.contains(event.target)) {
      suggestionBox.style.display = 'none';
    }
  });

  console.log('LeetCode Snippeter: Editor integration setup completed');
}

// Function to cleanup resources
function cleanup() {
  console.log('LeetCode Snippeter: Cleaning up resources');
  if (suggestionBox) {
    suggestionBox.remove();
    suggestionBox = null;
  }
  activeElement = null;
  currentWord = '';
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