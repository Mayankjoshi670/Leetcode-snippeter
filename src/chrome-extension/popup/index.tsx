import "../global.css";
import  { useState, useEffect, useCallback } from "react";
import { FaCopy, FaSearch } from "react-icons/fa";
import { TbTriangleFilled, TbTriangleInvertedFilled } from "react-icons/tb";

type Snippet = {
  title: string;
  snippet: string;
  expanded?: boolean;
};

export const Popup = () => {
  const [snippetTitle, setSnippetTitle] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    chrome.storage.local.get("snippets", (data) => {
      if (data.snippets) {
        setSnippets(data.snippets);
      }
    });
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

    chrome.storage.local.set({ snippets: updatedSnippets }, () => {
      setSnippets(updatedSnippets);
      setSnippetTitle("");
      setCodeSnippet("");
    });
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
    <div className="h-full w-full flex flex-col justify-center items-center p-4 bg-gray-100">
      <div className="w-full h-full max-w-3xl rounded-lg shadow-lg p-6 bg-white flex flex-col">
        <h2 className="text-2xl font-semibold mb-2">Leetcode Snippeter</h2>
        <div className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Snippet Title"
            value={snippetTitle}
            onChange={(e) => setSnippetTitle(e.target.value)}
            className="p-3 border border-gray-300 rounded-md"
          />
          <div className="flex items-center w-full">
            <textarea
              placeholder="Code Snippet"
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              className="p-3 flex-grow border border-gray-300 rounded-md resize-none"
              rows={3}
            />
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={() => handleCopy(codeSnippet)}
                className="ml-4 mt-1 px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                Copy
              </button>
              <button
                onClick={handleSave}
                className="ml-4 px-4 py-3 mt-5 bg-slate-700 text-white rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <h3 className="text-lg font-semibold mb-2 px-2">Saved Snippets:</h3>
          <div className="relative flex w-full items-center">
            <input
              type="text"
              placeholder="Search snippets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
            />
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="mt-4 overflow-y-auto">
          {filteredSnippets.length > 0 ? (
            filteredSnippets.map((snippet, index) => (
              <div key={index} className="p-4 border border-gray-300 rounded-md mb-2">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleSnippet(index)}
                >
                  <span className="font-medium">{snippet.title}</span>
                  <span className="text-gray-500">
                    {snippet.expanded ? <TbTriangleFilled /> : <TbTriangleInvertedFilled />}
                  </span>
                </div>
                {snippet.expanded && (
                  <div className="mt-2">
                    <div className="relative bg-gray-100 p-2 rounded-md overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{snippet.snippet}</pre>
                      <button
                        onClick={() => handleCopy(snippet.snippet)}
                        className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white rounded-md"
                        title="Copy"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No snippets found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
