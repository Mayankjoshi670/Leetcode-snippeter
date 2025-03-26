chrome.runtime.onInstalled.addListener(() => {
    console.log("Leetcode Snippeter extension installed!");
  });
  
  // background.js

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSnippet') {
    console.log(sender)
      const word = request.word;
      chrome.storage.local.get('LeetcodeSnippeter', (data) => {
          const snippets = data.snippets || [];
          console.log(snippets) ; 
          const matchedSnippet = snippets.find((snippet: { title: string }) => snippet.title.toLowerCase() === word.toLowerCase());
          sendResponse({ snippet: matchedSnippet });
      });
      return true; // Required for async sendResponse
  }
});