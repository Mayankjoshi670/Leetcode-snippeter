// Background script for Leetcode Snippeter
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with empty snippets array if not exists
  chrome.storage.local.get(['snippets'], (result) => {
    if (!result.snippets) {
      chrome.storage.local.set({ snippets: [] });
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SNIPPETS') {
    chrome.storage.local.get(['snippets'], (result) => {
      sendResponse({ snippets: result.snippets || [] });
    });
    return true; // Will respond asynchronously
  }
}); 