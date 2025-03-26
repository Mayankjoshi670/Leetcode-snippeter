// Content script for LeetCode editor integration
let snippets = [];
let isExtensionContextValid = true;
let monacoProvider = null;

// Function to check if extension context is valid
function checkExtensionContext() {
  try {
    chrome.runtime.getURL('');
    return true;
  } catch (e) {
    return false;
  }
}

// Load snippets from storage
function loadSnippets() {
  if (!isExtensionContextValid) return;
  
  chrome.storage.local.get(['snippets'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error loading snippets:', chrome.runtime.lastError);
      return;
    }
    snippets = result.snippets || [];
  });
}

// Listen for storage changes
function setupStorageListener() {
  if (!isExtensionContextValid) return;
  
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.snippets) {
      snippets = changes.snippets.newValue || [];
    }
  });
}

// Function to setup Monaco integration
function setupMonacoIntegration() {
  if (!isExtensionContextValid) return;
  
  // Wait for Monaco to be available
  const waitForMonaco = setInterval(() => {
    if (!isExtensionContextValid) {
      clearInterval(waitForMonaco);
      return;
    }

    if (window.monaco) {
      clearInterval(waitForMonaco);
      
      try {
        // Get all editor instances
        const editors = window.monaco.editor.getEditors();
        if (!editors.length) {
          console.log('No Monaco editor instances found');
          return;
        }
        
        console.log('Found Monaco editor, setting up completion provider');
        
        // Unregister existing provider if any
        if (monacoProvider) {
          monacoProvider.dispose();
        }
        
        // Register our custom completion provider
        monacoProvider = window.monaco.languages.registerCompletionItemProvider(['javascript', 'python', 'java', 'cpp'], {
          triggerCharacters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
          provideCompletionItems: function(model, position) {
            if (!isExtensionContextValid) {
              return Promise.resolve({ suggestions: [] });
            }

            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn
            };
            
            // Get snippets from storage
            return new Promise((resolve) => {
              chrome.storage.local.get(['snippets'], (result) => {
                if (chrome.runtime.lastError) {
                  console.error('Error getting snippets:', chrome.runtime.lastError);
                  resolve({ suggestions: [] });
                  return;
                }
                
                const snippets = result.snippets || [];
                const suggestions = snippets
                  .filter(snippet => snippet.title.toLowerCase().includes(word.word.toLowerCase()))
                  .map(snippet => ({
                    label: snippet.title,
                    kind: window.monaco.languages.CompletionItemKind.Snippet,
                    insertText: snippet.code,
                    range: range,
                    detail: 'Leetcode Snippeter',
                    insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: snippet.code
                  }));
                resolve({ suggestions });
              });
            });
          }
        });

        // Add custom commands to Monaco
        window.monaco.editor.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Space, function() {
          if (!isExtensionContextValid) return;
          const editor = window.monaco.editor.getEditors()[0];
          if (editor) {
            editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
          }
        });
        
        console.log('Completion provider registered successfully');
      } catch (error) {
        console.error('Error setting up Monaco integration:', error);
      }
    }
  }, 100);
}

// Function to detect when Monaco Editor is loaded
function detectMonacoEditor() {
  const observer = new MutationObserver((mutations) => {
    if (!isExtensionContextValid) {
      observer.disconnect();
      return;
    }

    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        const editor = document.querySelector('.monaco-editor');
        if (editor) {
          // Wait a bit for Monaco to be fully initialized
          setTimeout(() => {
            setupMonacoIntegration();
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
  isExtensionContextValid = false;
  if (monacoProvider) {
    monacoProvider.dispose();
    monacoProvider = null;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SNIPPETS') {
    if (!isExtensionContextValid) {
      sendResponse({ snippets: [] });
      return;
    }
    sendResponse({ snippets });
  }
});

// Initialize
loadSnippets();
setupStorageListener();
detectMonacoEditor();

// Check extension context periodically
setInterval(() => {
  if (!checkExtensionContext()) {
    cleanup();
  }
}, 5000); 