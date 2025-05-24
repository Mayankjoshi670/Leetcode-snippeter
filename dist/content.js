 console.log('LeetCode Snippeter: Content script loaded');

let snippets = [];
let suggestionBox = null;
let currentWord = '';
let sideWindow = null;
let sideWindowButton = null;

let chatHistory = [];

function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => {
    script.remove();
  };
}

function sendToInjected(action, data) {
  window.postMessage({
    type: 'LEETCODE_SNIPPETER',
    action,
    data
  }, '*');
}

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

// // Create suggestion box element
// function createSuggestionBox() {
//   console.log('LeetCode Snippeter: Creating suggestion box');
//   const box = document.createElement('div');
//   box.className = 'leetcode-snippeter-suggestion-box';
//   box.style.cssText = `
//     position: absolute;
//     background: #ffffff;
//     border: 1px solid #e0e0e0;
//     border-radius: 6px;
//     box-shadow: 0 4px 12px rgba(0,0,0,0.1);
//     max-height: 200px;
//     overflow-y: auto;
//     z-index: 999999;
//     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
//     display: none;
//     padding: 4px;
//     min-width: 150px;
//     max-width: 300px;
//   `;
//   return box;
// }


// Create suggestion box element with Monaco Editor styling
function createSuggestionBox() {
  console.log('LeetCode Snippeter: Creating suggestion box');
  const box = document.createElement('div');
  box.className = 'leetcode-snippeter-suggestion-box';
  box.style.cssText = `
    position: absolute;
    background: #252526;
    border: 1px solid #454545;
    border-radius: 3px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.36);
    max-height: 190px;
    overflow-y: auto;
    z-index: 999999;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
    font-size: 13px;
    display: none;
    padding: 0;
    min-width: 200px;
    max-width: 400px;
    color: #cccccc;
  `;
  
  // Custom scrollbar styling to match Monaco
  const style = document.createElement('style');
  style.textContent = `
    .leetcode-snippeter-suggestion-box::-webkit-scrollbar {
      width: 10px;
    }
    .leetcode-snippeter-suggestion-box::-webkit-scrollbar-track {
      background: #2d2d30;
    }
    .leetcode-snippeter-suggestion-box::-webkit-scrollbar-thumb {
      background: #424242;
      border-radius: 5px;
    }
    .leetcode-snippeter-suggestion-box::-webkit-scrollbar-thumb:hover {
      background: #4f4f4f;
    }
    
    .leetcode-snippeter-suggestion-item {
      padding: 6px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #2d2d30;
      transition: background-color 0.1s ease;
    }
    
    .leetcode-snippeter-suggestion-item:hover,
    .leetcode-snippeter-suggestion-item.selected {
      background-color: #094771;
    }
    
    .leetcode-snippeter-suggestion-item:last-child {
      border-bottom: none;
    }
    
    .leetcode-snippeter-suggestion-icon {
      width: 16px;
      height: 16px;
      margin-right: 8px;
      background: #569cd6;
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: white;
      flex-shrink: 0;
    }
    
    .leetcode-snippeter-suggestion-text {
      flex: 1;
      overflow: hidden;
    }
    
    .leetcode-snippeter-suggestion-label {
      color: #cccccc;
      font-weight: 500;
    }
    
    .leetcode-snippeter-suggestion-detail {
      color: #858585;
      font-size: 12px;
      margin-top: 1px;
    }
  `;
  
  if (!document.getElementById('monaco-suggestion-styles')) {
    style.id = 'monaco-suggestion-styles';
    document.head.appendChild(style);
  }
  
  return box;
}

// Helper function to create suggestion items
function createSuggestionItem(text, detail = '', type = 'S') {
  const item = document.createElement('div');
  item.className = 'leetcode-snippeter-suggestion-item';
  
  const icon = document.createElement('div');
  icon.className = 'leetcode-snippeter-suggestion-icon';
  icon.textContent = type; // S for Snippet, F for Function, etc.
  
  const textDiv = document.createElement('div');
  textDiv.className = 'leetcode-snippeter-suggestion-text';
  
  const label = document.createElement('div');
  label.className = 'leetcode-snippeter-suggestion-label';
  label.textContent = text;
  
  textDiv.appendChild(label);
  
  if (detail) {
    const detailDiv = document.createElement('div');
    detailDiv.className = 'leetcode-snippeter-suggestion-detail';
    detailDiv.textContent = detail;
    textDiv.appendChild(detailDiv);
  }
  
  item.appendChild(icon);
  item.appendChild(textDiv);
  
  return item;
}

// Create side window button
function createSideWindowButton() {
  console.log('LeetCode Snippeter: Creating side window button');
  const button = document.createElement('button');
  button.className = 'leetcode-snippeter-side-button';
  button.innerHTML = 'AskAi';
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
    right: -400px;
    width: 400px;
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
    background-color: #1a90ff;
    color: white;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'AI Assistant';
  title.style.cssText = `
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  `;
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    background: none;
    border: none;
    font-size: 24px;
    color: white;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  `;
  closeButton.addEventListener('click', toggleSideWindow);
  
  // Add clear chat button to header
  const clearButton = document.createElement('button');
  clearButton.innerHTML = 'Clear Chat';
  clearButton.style.cssText = `
    background: none;
    border: 1px solid #ffffff;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    margin-left: 8px;
    transition: all 0.2s ease;
  `;
  clearButton.addEventListener('mouseover', () => {
    clearButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  });
  clearButton.addEventListener('mouseout', () => {
    clearButton.style.backgroundColor = 'transparent';
  });
  clearButton.addEventListener('click', () => {
    clearChatHistory();
    chatContainer.innerHTML = '';
    chatContainer.appendChild(welcomeMessage);
  });
  
  header.appendChild(title);
  header.appendChild(closeButton);
  header.appendChild(clearButton);
  
  // Create content
  const content = document.createElement('div');
  content.className = 'leetcode-snippeter-side-content';
  content.style.cssText = `
    padding: 16px;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  `;

  // Create chat container
  const chatContainer = document.createElement('div');
  chatContainer.className = 'leetcode-snippeter-chat';
  chatContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: #1a1a1a;
    color: #ffffff;
  `;

  // Create input container
  const inputContainer = document.createElement('div');
  inputContainer.style.cssText = `
    padding: 16px;
    border-top: 1px solid #333;
    display: flex;
    gap: 8px;
    background-color: #1a1a1a;
  `;

  const input = document.createElement('textarea');
  input.placeholder = 'Ask for help, hints, or code correction...';
  input.style.cssText = `
    flex: 1;
    padding: 12px;
    border: 1px solid #333;
    border-radius: 6px;
    resize: none;
    height: 40px;
    font-family: inherit;
    font-size: 14px;
    background-color: #2a2a2a;
    color: #ffffff;
    transition: border-color 0.2s ease;
  `;

  input.addEventListener('focus', () => {
    input.style.borderColor = '#1a90ff';
  });

  input.addEventListener('blur', () => {
    input.style.borderColor = '#333';
  });

  const sendButton = document.createElement('button');
  sendButton.innerHTML = 'Send';
  sendButton.style.cssText = `
    padding: 8px 16px;
    background-color: #1a90ff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;
  `;

  sendButton.addEventListener('mouseover', () => {
    sendButton.style.backgroundColor = '#0078e7';
  });

  sendButton.addEventListener('mouseout', () => {
    sendButton.style.backgroundColor = '#1a90ff';
  });

  // Add welcome message
  const welcomeMessage = document.createElement('div');
  welcomeMessage.className = 'leetcode-snippeter-message assistant';
  welcomeMessage.innerHTML = `
    <div class="message-content">
      <p>Hi! I'm your AI coding assistant. I can help you with:</p>
      <ul>
        <li>Generating code solutions</li>
        <li>Providing hints and explanations</li>
        <li>Correcting and optimizing your code</li>
      </ul>
      <p>Just type your question below!</p>
      <p><small>Note: I'll remember our conversation to provide better context-aware responses.</small></p>
    </div>
  `;
  welcomeMessage.style.cssText = `
    background-color: #2a2a2a;
    padding: 16px;
    border-radius: 8px;
    max-width: 80%;
    align-self: flex-start;
    color: #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;

  chatContainer.appendChild(welcomeMessage);

  async function getCurrentQuestionInfo() {
    try {
      // Grab the full URL of the current tab
      const href = window.location.href;
      let questionName = 'Unknown Problem';

      // Parse out the path segments
      const urlObj = new URL(href);
      const segments = urlObj.pathname.split('/').filter(Boolean);

      // If this is a LeetCode problem page, segments[0] === "problems"
      if (segments[0] === 'problems' && segments[1]) {
        // segments[1] is the slug, e.g. "two-sum"
        questionName = segments[1].replace(/-/g, ' ');
      }

      // Get code from Monaco editor using a more reliable method
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.textContent = `
          (function() {
            try {
              // Try multiple methods to get the editor
              let editor = null;
              
              // Method 1: Direct access to Monaco instance
              if (window.monaco && window.monaco.editor) {
                const models = window.monaco.editor.getModels();
                if (models && models.length > 0) {
                  editor = models[0];
                }
              }
              
              // Method 2: Access through the editor container
              if (!editor) {
                const editorContainer = document.querySelector('.monaco-editor');
                if (editorContainer && editorContainer.__monaco) {
                  editor = editorContainer.__monaco;
                }
              }
              
              // Method 3: Access through the editor instance
              if (!editor) {
                const editorElement = document.querySelector('.monaco-editor');
                if (editorElement) {
                  const editorInstance = editorElement.querySelector('.monaco-editor-background');
                  if (editorInstance && editorInstance.__monaco) {
                    editor = editorInstance.__monaco;
                  }
                }
              }

              if (!editor) {
                window.postMessage({ type: 'MONACO_CODE', error: 'Could not find Monaco editor instance' }, '*');
                return;
              }

              // Get the code using the editor instance
              const code = editor.getValue();
              if (!code) {
                window.postMessage({ type: 'MONACO_CODE', error: 'Could not get code from editor' }, '*');
                return;
              }

              window.postMessage({ type: 'MONACO_CODE', code }, '*');
            } catch (error) {
              console.error('Monaco access error:', error);
              window.postMessage({ type: 'MONACO_CODE', error: error.message }, '*');
            }
          })();
        `;
        (document.head || document.documentElement).appendChild(script);
        script.remove();

        // Set a timeout to handle cases where we don't get a response
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handler);
          resolve({ questionName, code: '' });
        }, 2000);

        function handler(event) {
          if (event.data.type === 'MONACO_CODE') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            if (event.data.error) {
              console.error('Error getting code from Monaco:', event.data.error);
              resolve({ questionName, code: '' });
            } else {
              resolve({ questionName, code: event.data.code });
            }
          }
        }

        window.addEventListener('message', handler);
      });
    } catch (error) {
      console.error('Error in getCurrentQuestionInfo:', error);
      return { questionName: 'Unknown Problem', code: '' };
    }
  }

  // Function to get API key from storage
  async function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['geminiApiKey'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting API key:', chrome.runtime.lastError);
          resolve(null);
          return;
        }
        
        const apiKey = result.geminiApiKey;
        if (!apiKey) {
          console.error('No API key found in storage');
          resolve(null);
          return;
        }
        
        resolve(apiKey);
      });
    });
  }

  // Function to format chat history for LLM
  function formatChatHistory() {
    return chatHistory.map(msg => {
      return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`;
    }).join('\n\n');
  }

  // Function to call Google Gemini API
  async function callGeminiAPI(prompt, context) {
    try {
      const API_KEY = await getApiKey();
      if (!API_KEY) {
        throw new Error('API key not found. Please set your Google AI API key in the extension options.');
      }

      // Validate API key format
      if (!API_KEY.startsWith('AIza')) {
        throw new Error('Invalid API key format. Please check your Google AI API key.');
      }

      console.log('Making API call to Gemini...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Context: You are a coding assistant helping with a LeetCode problem.

Problem: ${context.questionName}

Current Code:
${context.code}

Chat History:
${formatChatHistory()}

User Question: ${prompt}

Please provide a helpful response focusing on:
1. Understanding the problem
2. Providing hints or explanations
3. Suggesting code improvements
4. Explaining time and space complexity
5. Best practices and optimization tips

Remember to maintain context from the previous conversation.`
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from API');
      }
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error(`Failed to get response from Gemini API: ${error.message}`);
    }
  }

  // Function to add message to chat with proper formatting
  function addMessage(content, isUser = false) {
    // Add message to chat history
    chatHistory.push({
      role: isUser ? 'user' : 'assistant',
      content: content,
      timestamp: new Date().toISOString()
    });

    const message = document.createElement('div');
    message.className = `leetcode-snippeter-message ${isUser ? 'user' : 'assistant'}`;
    
    // Format the content to handle markdown-like syntax
    const formattedContent = content
      // Handle headers
      .replace(/^#+\s+(.+)$/gm, '<h1>$1</h1>')
      .replace(/^##+\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/^###+\s+(.+)$/gm, '<h3>$1</h3>')
      // Handle bold and italic
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Handle code blocks with language
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        return `<pre><code class="language-${language || 'plaintext'}">${code.trim()}</code></pre>`;
      })
      // Handle inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Handle lists
      .replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      // Handle numbered lists
      .replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>')
      // Handle newlines
      .replace(/\n/g, '<br>');

    message.innerHTML = `<div class="message-content">${formattedContent}</div>`;
    message.style.cssText = `
      background-color: ${isUser ? '#1a90ff' : '#2a2a2a'};
      padding: 16px;
      border-radius: 8px;
      max-width: 80%;
      align-self: ${isUser ? 'flex-end' : 'flex-start'};
      color: #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.5;
    `;

    // Add enhanced styling for markdown elements
    const style = document.createElement('style');
    style.textContent = `
      .leetcode-snippeter-message h1 {
        font-size: 1.5em;
        margin: 16px 0 8px 0;
        color: #ffffff;
        border-bottom: 1px solid #444;
        padding-bottom: 8px;
      }
      .leetcode-snippeter-message h2 {
        font-size: 1.3em;
        margin: 14px 0 7px 0;
        color: #ffffff;
      }
      .leetcode-snippeter-message h3 {
        font-size: 1.1em;
        margin: 12px 0 6px 0;
        color: #ffffff;
      }
      .leetcode-snippeter-message pre {
        background-color: #1a1a1a;
        padding: 12px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 8px 0;
        border: 1px solid #444;
      }
      .leetcode-snippeter-message code {
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 13px;
        line-height: 1.4;
        background-color: #1a1a1a;
        padding: 2px 4px;
        border-radius: 3px;
      }
      .leetcode-snippeter-message ul, 
      .leetcode-snippeter-message ol {
        margin: 8px 0;
        padding-left: 24px;
      }
      .leetcode-snippeter-message li {
        margin: 4px 0;
        line-height: 1.5;
      }
      .leetcode-snippeter-message strong {
        font-weight: 600;
        color: #ffffff;
      }
      .leetcode-snippeter-message em {
        font-style: italic;
        color: #e0e0e0;
      }
      .leetcode-snippeter-message br {
        margin: 4px 0;
      }
      .leetcode-snippeter-message p {
        margin: 8px 0;
      }
    `;
    document.head.appendChild(style);

    chatContainer.appendChild(message);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Update loading message style
  function showLoadingMessage() {
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'leetcode-snippeter-message assistant loading';
    loadingMessage.innerHTML = '<div class="message-content">Thinking...</div>';
    loadingMessage.style.cssText = `
      background-color: #2a2a2a;
      padding: 16px;
      border-radius: 8px;
      max-width: 80%;
      align-self: flex-start;
      color: #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    chatContainer.appendChild(loadingMessage);
    return loadingMessage;
  }

  // Handle send button click
  sendButton.addEventListener('click', async () => {
    const message = input.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, true);
    input.value = '';

    // Get current question info
    const questionInfo = await getCurrentQuestionInfo();
    console.log('Question info:', questionInfo);
    
    // Add loading message
    const loadingMessage = showLoadingMessage();

    try {
      const response = await callGeminiAPI(message, questionInfo);
      loadingMessage.remove();
      addMessage(response);
    } catch (error) {
      console.error('Error in chat:', error);
      loadingMessage.remove();
      addMessage(`Error: ${error.message}. Please check your API key in the extension options.`, false);
    }
  });

  // Handle Enter key in input
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });

  inputContainer.appendChild(input);
  inputContainer.appendChild(sendButton);
  
  content.appendChild(chatContainer);
  content.appendChild(inputContainer);
  
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
    sideWindow.style.right = '-400px';
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

function getMonacoCode() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        try {
          const editor = monaco.editor.getModels()[0];
          if (!editor) {
            window.postMessage({ type: 'MONACO_CODE', error: 'No Monaco editor found' }, '*');
            return;
          }
          const code = editor.getValue();
          const language = editor.getLanguageId();
          const problemTitle = document.querySelector('[data-cy="question-title"]')?.textContent || 'Unknown Problem';
          window.postMessage({ 
            type: 'MONACO_CODE', 
            data: {
              code,
              language,
              problemTitle,
              timestamp: new Date().toISOString()
            }
          }, '*');
        } catch (error) {
          window.postMessage({ 
            type: 'MONACO_CODE', 
            error: error.message 
          }, '*');
        }
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();

    window.addEventListener('message', function handler(event) {
      if (event.data.type === 'MONACO_CODE') {
        window.removeEventListener('message', handler);
        if (event.data.error) {
          resolve({ error: event.data.error });
        } else {
          resolve(event.data.data);
        }
      }
    });
  });
}

// Function to format code for LLM
function formatCodeForLLM(codeData) {
  if (codeData.error) {
    return `Error: ${codeData.error}`;
  }

  return `Problem: ${codeData.problemTitle}
Language: ${codeData.language}
Timestamp: ${codeData.timestamp}

Code:
\`\`\`${codeData.language}
${codeData.code}
\`\`\``;
}

// Example usage:
// getMonacoCode().then(codeData => {
//   const formattedCode = formatCodeForLLM(codeData);
//   console.log(formattedCode);
//   // Here you can send formattedCode to your LLM
// });

// Add function to clear chat history
function clearChatHistory() {
  chatHistory = [];
}