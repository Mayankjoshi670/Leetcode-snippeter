// // This script runs in the page context and has access to the Monaco editor
// console.log('LeetCode Snippeter: Injected script loaded');

// // Handle messages from content script
// window.addEventListener('message', (event) => {
//   if (event.data.type !== 'LEETCODE_SNIPPETER') return;

//   switch (event.data.action) {
//     case 'GET_CURRENT_WORD':
//       getCurrentWord();
//       break;
//     case 'INSERT_SNIPPET':
//       insertSnippet(event.data.data.snippet);
//       break;
//   }
// });

// // Get current word from Monaco editor
// function getCurrentWord() {
//   try {
//     // Use getEditors() instead of getModels()
//     const editor = monaco.editor.getEditors?.()?.[0];
//     if (editor) {
//       const position = editor.getPosition();
//       const model = editor.getModel();
//       if (position && model) {
//         const word = model.getWordAtPosition(position);
//         if (word) {
//           window.postMessage({
//             type: 'LEETCODE_SNIPPETER_RESPONSE',
//             action: 'CURRENT_WORD',
//             data: {
//               word: word.word,
//               position: {
//                 lineNumber: position.lineNumber,
//                 column: position.column
//               }
//             }
//           }, '*');
//           return;
//         }
//       }
//     }
//   } catch (e) {
//     console.error('LeetCode Snippeter: Error getting current word:', e);
//   }
//   window.postMessage({
//     type: 'LEETCODE_SNIPPETER_RESPONSE',
//     action: 'CURRENT_WORD',
//     data: null
//   }, '*');
// }

// // Insert snippet using Monaco editor API
// function insertSnippet(text) {
//   try {
//     const editor = monaco.editor.getEditors?.()?.[0];
//     if (editor) {
//       const position = editor.getPosition();
//       const model = editor.getModel();
//       if (position && model) {
//         const word = model.getWordAtPosition(position);
//         if (word) {
//           const range = {
//             startLineNumber: position.lineNumber,
//             startColumn: word.startColumn,
//             endLineNumber: position.lineNumber,
//             endColumn: word.endColumn
//           };
          
//           editor.executeEdits('leetcode-snippeter', [{
//             range: range,
//             text: text,
//             forceMoveMarkers: true
//           }]);
//         }
//       }
//     }
//   } catch (e) {
//     console.error('LeetCode Snippeter: Error inserting snippet:', e);
//   }
// }


// This script runs in the page context and has access to the Monaco editor
console.log('LeetCode Snippeter: Injected script loaded');

// Handle messages from content script
window.addEventListener('message', (event) => {
  if (event.data.type !== 'LEETCODE_SNIPPETER') return;

  switch (event.data.action) {
    case 'GET_CURRENT_WORD':
      getCurrentWord();
      break;
    case 'INSERT_SNIPPET':
      insertSnippet(event.data.data.snippet);
      break;
  }
});

// Get current word from Monaco editor
function getCurrentWord() {
  try {
    const editor = monaco.editor.getEditors?.()?.[0];
    if (editor) {
      const position = editor.getPosition();
      const model = editor.getModel();
      if (position && model) {
        const word = model.getWordAtPosition(position);
        if (word) {
          window.postMessage({
            type: 'LEETCODE_SNIPPETER_RESPONSE',
            action: 'CURRENT_WORD',
            data: {
              word: word.word,
              position: {
                lineNumber: position.lineNumber,
                column: position.column
              }
            }
          }, '*');
          return;
        }
      }
    }
  } catch (e) {
    console.error('LeetCode Snippeter: Error getting current word:', e);
  }
  window.postMessage({
    type: 'LEETCODE_SNIPPETER_RESPONSE',
    action: 'CURRENT_WORD',
    data: null
  }, '*');
}

function insertSnippet(snippetText) {
  try {
    if (!snippetText || typeof snippetText !== 'string') {
      console.warn('LeetCode Snippeter: snippetText is not valid:', snippetText);
      return;
    }

    const editor = monaco.editor.getEditors?.()?.[0];
    if (!editor) return;

    const snippetController = editor.getContribution('snippetController2');

    // Optional: Transform snippet for tab stops
    const transformedSnippet = snippetText.replace(/(\$[0-9]+)/g, '\\$1');

    snippetController.insert(transformedSnippet);
  } catch (e) {
    console.error('LeetCode Snippeter: Error inserting snippet:', e);
  }
}
