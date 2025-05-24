// import "../global.css";
// import  { useState, useEffect, useCallback } from "react";
// import { FaCopy, FaSearch } from "react-icons/fa";
// import { TbTriangleFilled, TbTriangleInvertedFilled } from "react-icons/tb";

// type Snippet = {
//   title: string;
//   snippet: string;
//   expanded?: boolean;
// };

// export const Popup = () => {
//   const [snippetTitle, setSnippetTitle] = useState("");
//   const [codeSnippet, setCodeSnippet] = useState("");
//   const [snippets, setSnippets] = useState<Snippet[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");

//   useEffect(() => {
//     chrome.storage.local.get("snippets", (data) => {
//       if (data.snippets) {
//         setSnippets(data.snippets);
//       }
//     });
//   }, []);

//   const handleCopy = useCallback((text: string) => {
//     navigator.clipboard.writeText(text);
//   }, []);

//   const handleSave = useCallback(() => {
//     const title = snippetTitle.trim();
//     const code = codeSnippet.trim();

//     if (!title || !code) {
//       alert("Both title and code are required!");
//       return;
//     }

//     // Check for duplicate titles
//     if (snippets.some(s => s.title.toLowerCase() === title.toLowerCase())) {
//       alert("A snippet with this title already exists!");
//       return;
//     }

//     // Validate title format (alphanumeric and hyphens only)
//     if (!/^[\w-]+$/.test(title)) {
//       alert("Title can only contain letters, numbers, and hyphens!");
//       return;
//     }

//     const newSnippet: Snippet = { title, snippet: code };
//     const updatedSnippets = [...snippets, newSnippet];

//     chrome.storage.local.set({ snippets: updatedSnippets }, () => {
//       setSnippets(updatedSnippets);
//       setSnippetTitle("");
//       setCodeSnippet("");
//     });
//   }, [snippetTitle, codeSnippet, snippets]);

//   const toggleSnippet = useCallback((index: number) => {
//     setSnippets((prev) =>
//       prev.map((snippet, i) =>
//         i === index ? { ...snippet, expanded: !snippet.expanded } : snippet
//       )
//     );
//   }, []);

//   const filteredSnippets = snippets.filter((snippet) =>
//     snippet.title.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <div className="h-full w-full flex flex-col justify-center items-center p-4 bg-gray-100">
//       <div className="w-full h-full max-w-3xl rounded-lg shadow-lg p-6 bg-white flex flex-col">
//         <h2 className="text-2xl font-semibold mb-2">Leetcode Snippeter</h2>
//         <div className="flex flex-col space-y-4">
//           <input
//             type="text"
//             placeholder="Snippet Title"
//             value={snippetTitle}
//             onChange={(e) => setSnippetTitle(e.target.value)}
//             className="p-3 border border-gray-300 rounded-md"
//           />
//           <div className="flex items-center w-full">
//             <textarea
//               placeholder="Code Snippet"
//               value={codeSnippet}
//               onChange={(e) => setCodeSnippet(e.target.value)}
//               className="p-3 flex-grow border border-gray-300 rounded-md resize-none"
//               rows={3}
//             />
//             <div className="flex flex-col items-center justify-center">
//               <button
//                 onClick={() => handleCopy(codeSnippet)}
//                 className="ml-4 mt-1 px-4 py-2 bg-blue-500 text-white rounded-md"
//               >
//                 Copy
//               </button>
//               <button
//                 onClick={handleSave}
//                 className="ml-4 px-4 py-3 mt-5 bg-slate-700 text-white rounded-md"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center justify-between mt-4">
//           <h3 className="text-lg font-semibold mb-2 px-2">Saved Snippets:</h3>
//           <div className="relative flex w-full items-center">
//             <input
//               type="text"
//               placeholder="Search snippets..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
//             />
//             <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//           </div>
//         </div>

//         <div className="mt-4 overflow-y-auto">
//           {filteredSnippets.length > 0 ? (
//             filteredSnippets.map((snippet, index) => (
//               <div key={index} className="p-4 border border-gray-300 rounded-md mb-2">
//                 <div
//                   className="flex justify-between items-center cursor-pointer"
//                   onClick={() => toggleSnippet(index)}
//                 >
//                   <span className="font-medium">{snippet.title}</span>
//                   <span className="text-gray-500">
//                     {snippet.expanded ? <TbTriangleFilled /> : <TbTriangleInvertedFilled />}
//                   </span>
//                 </div>
//                 {snippet.expanded && (
//                   <div className="mt-2">
//                     <div className="relative bg-gray-100 p-2 rounded-md overflow-x-auto">
//                       <pre className="whitespace-pre-wrap">{snippet.snippet}</pre>
//                       <button
//                         onClick={() => handleCopy(snippet.snippet)}
//                         className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white rounded-md"
//                         title="Copy"
//                       >
//                         <FaCopy />
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))
//           ) : (
//             <p className="text-gray-500">No snippets found.</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };


import { useState, useEffect, useCallback } from "react";
import { FaCopy, FaSearch, FaSave, FaPlus, FaCode } from "react-icons/fa";
import { TbChevronDown, TbChevronUp } from "react-icons/tb";

type Snippet = {
  title: string;
  snippet: string;
  expanded?: boolean;
};

export const  Popup = () => {
  const [snippetTitle, setSnippetTitle] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    // Mock data for preview
    setSnippets([
      { title: "two-sum", snippet: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}", expanded: false },
      { title: "binary-search", snippet: "function binarySearch(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n  \n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  \n  return -1;\n}", expanded: false }
    ]);
  }, []);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleSave = useCallback(() => {
    const title = snippetTitle.trim();
    const code = codeSnippet.trim();

    if (!title || !code) {
      alert("Both title and code are required!");
      return;
    }

    // Check for duplicate titles
    if (snippets.some(s => s.title.toLowerCase() === title.toLowerCase())) {
      alert("A snippet with this title already exists!");
      return;
    }

    // Validate title format (alphanumeric and hyphens only)
    if (!/^[\w-]+$/.test(title)) {
      alert("Title can only contain letters, numbers, and hyphens!");
      return;
    }

    const newSnippet: Snippet = { title, snippet: code };
    const updatedSnippets = [...snippets, newSnippet];

    setSnippets(updatedSnippets);
    setSnippetTitle("");
    setCodeSnippet("");
    setIsAdding(false);
  }, [snippetTitle, codeSnippet, snippets]);

  const toggleSnippet = useCallback((index: number) => {
    setSnippets((prev) =>
      prev.map((snippet, i) =>
        i === index ? { ...snippet, expanded: !snippet.expanded } : snippet
      )
    );
  }, []);

  const filteredSnippets = snippets.filter((snippet) =>
    snippet.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 font-sans">
      <div className="max-w-3xl mx-auto rounded-xl shadow-lg overflow-hidden bg-white">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaCode className="text-2xl" />
              <h1 className="text-2xl font-bold">Leetcode Snippeter</h1>
            </div>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="bg-white text-indigo-600 px-3 py-2 rounded-lg flex items-center space-x-1 hover:bg-indigo-100 transition-all"
            >
              <FaPlus size={14} />
              <span className="font-medium">New Snippet</span>
            </button>
          </div>
        </div>

        {/* Add Snippet Form */}
        {isAdding && (
          <div className="p-5 bg-indigo-50 border-b border-indigo-100">
            <div className="flex flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Snippet Title</label>
                <input
                  type="text"
                  placeholder="E.g., binary-search"
                  value={snippetTitle}
                  onChange={(e) => setSnippetTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code Snippet</label>
                <div className="flex flex-col lg:flex-row lg:space-x-4">
                  <textarea
                    placeholder="Paste your code here..."
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    className="p-3 flex-grow border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm resize-none"
                    rows={6}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setSnippetTitle("");
                    setCodeSnippet("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <FaSave size={14} />
                  <span>Save Snippet</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-5 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search snippets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pl-10 pr-4 py-3"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Snippets List */}
        <div className="p-5 max-h-96 overflow-y-auto">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            {filteredSnippets.length} {filteredSnippets.length === 1 ? 'Snippet' : 'Snippets'} Found
          </h2>
          
          {filteredSnippets.length > 0 ? (
            <div className="space-y-3">
              {filteredSnippets.map((snippet, index) => (
                <div 
                  key={index} 
                  className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="flex justify-between items-center p-4 cursor-pointer bg-gray-50 hover:bg-gray-100"
                    onClick={() => toggleSnippet(index)}
                  >
                    <span className="font-medium text-gray-800">{snippet.title}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(snippet.snippet);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
                        title="Copy"
                      >
                        <FaCopy size={14} />
                      </button>
                      {snippet.expanded ? 
                        <TbChevronUp className="text-gray-500" /> : 
                        <TbChevronDown className="text-gray-500" />
                      }
                    </div>
                  </div>
                  
                  {snippet.expanded && (
                    <div className="p-4 bg-gray-900 overflow-x-auto">
                      <pre className="text-gray-100 font-mono text-sm whitespace-pre-wrap">{snippet.snippet}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No snippets found.</p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-indigo-600 hover:text-indigo-800"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}