import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { JSONTree } from "react-json-tree";
import jmespath from "jmespath";
import { parseBodyAsJson } from "../../utils/bodyUtils";
import { MonacoEditor } from "../../../ui/MonacoEditor";
import { FiZap, FiLayers, FiSearch, FiCode, FiEye } from "react-icons/fi";

export const JSONTreeMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
  
  const [requestData, setRequestData] = useState<RequestPairData | null>(null);
  const [responseData, setResponseData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"request" | "response">("response");
  
  // Transformation states
  const [filterQuery, setFilterQuery] = useState("");
  const [isFlattened, setIsFlattened] = useState(false);
  const [hideNulls, setHideNulls] = useState(false);
  const [viewType, setViewType] = useState<"tree" | "raw">("tree");
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  useEffect(() => {
    if (!trafficId) return;
    setLoading(true);
    // Reset states when switching requests
    setFilterQuery("");
    setIsFlattened(false);
    setHideNulls(false);

    Promise.all([
      provider.getRequestPairData(trafficId),
      provider.getResponsePairData(trafficId)
    ]).then(([req, res]) => {
      setRequestData(req);
      setResponseData(res);
      if (!res?.body && req?.body) {
        setActiveTab("request");
      } else {
        setActiveTab("response");
      }
    }).finally(() => setLoading(false));
  }, [trafficId, provider]);

  const rawJson = useMemo(() => {
    const data = activeTab === "request" ? requestData : responseData;
    return parseBodyAsJson(data?.body);
  }, [activeTab, requestData, responseData]);

  const transformedJson = useMemo(() => {
    if (!rawJson) return null;
    let result;
    
    // 1. JMESPath Transformation
    if (filterQuery.trim()) {
      try {
        result = jmespath.search(rawJson, filterQuery);
      } catch (e) {
        console.error("JMESPath error", e);
        return undefined; // Error state
      }
    } else {
      result = JSON.parse(JSON.stringify(rawJson));
    }

    if (result === null || result === undefined) return result;

    // 2. Hide Nulls (Recursive)
    if (hideNulls && typeof result === 'object') {
      const removeNulls = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(removeNulls).filter(v => v !== null && v !== undefined);
        } else if (obj !== null && typeof obj === "object") {
          return Object.fromEntries(
            Object.entries(obj)
              .map(([k, v]) => [k, removeNulls(v)])
              .filter(([_, v]) => v !== null && v !== undefined)
          );
        }
        return obj;
      };
      result = removeNulls(result);
    }

    // 3. Flatten (Single Level)
    if (isFlattened && typeof result === 'object' && result !== null && !Array.isArray(result)) {
      const flatten = (obj: any, prefix = ""): any => {
        return Object.keys(obj).reduce((acc: any, k) => {
          const pre = prefix.length ? prefix + "." : "";
          if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flatten(obj[k], pre + k));
          } else {
            acc[pre + k] = obj[k];
          }
          return acc;
        }, {});
      };
      result = flatten(result);
    }

    return result;
  }, [rawJson, filterQuery, isFlattened, hideNulls]);

  const suggestions = useMemo(() => {
    if (!rawJson || !filterQuery.includes(".") && filterQuery.length === 0) {
        if (rawJson && typeof rawJson === 'object' && !Array.isArray(rawJson)) {
            return Object.keys(rawJson).sort();
        }
        return [];
    }

    try {
      const lastDotIndex = filterQuery.lastIndexOf(".");
      const parentPath = lastDotIndex === -1 ? "" : filterQuery.substring(0, lastDotIndex);
      const currentInput = lastDotIndex === -1 ? filterQuery : filterQuery.substring(lastDotIndex + 1);
      
      let context = parentPath ? jmespath.search(rawJson, parentPath) : rawJson;
      
      // If context is array, get keys from first element
      if (Array.isArray(context) && context.length > 0) {
        context = context[0];
      }

      if (context && typeof context === 'object' && !Array.isArray(context)) {
        return Object.keys(context)
          .filter(k => k.toLowerCase().startsWith(currentInput.toLowerCase()))
          .sort();
      }
    } catch (e) {
       return [];
    }
    return [];
  }, [rawJson, filterQuery]);

  const placeholderHint = useMemo(() => {
    if (!rawJson || typeof rawJson !== 'object' || Array.isArray(rawJson)) {
        return "Query (e.g. [?status==`active`].id)";
    }
    const keys = Object.keys(rawJson).slice(0, 3);
    if (keys.length === 0) return "Query (e.g. data.items[0].id)";
    return `Try typing: ${keys.join(", ")}... (JMESPath supported)`;
  }, [rawJson]);

  if (!trafficId) return <Placeholder text="Select a request to analyze JSON structure" />;
  if (loading) return <Placeholder text="Scanning object hierarchy..." />;

  const theme = {
    scheme: 'monokai',
    author: 'wimer hazenberg (http://www.monokai.nl)',
    base00: 'transparent',
    base01: '#383830',
    base02: '#49483e',
    base03: '#75715e',
    base04: '#a59f85',
    base05: '#f8f8f2',
    base06: '#f5f4f1',
    base07: '#f9f8f5',
    base08: '#f92672',
    base09: '#fd971f',
    base0A: '#f4bf75',
    base0B: '#a6e22e',
    base0C: '#a1efe4',
    base0D: '#66d9ef',
    base0E: '#ae81ff',
    base0F: '#cc6633',
  };

  const selectSuggestion = (key: string) => {
    const lastDotIndex = filterQuery.lastIndexOf(".");
    const parentPath = lastDotIndex === -1 ? "" : filterQuery.substring(0, lastDotIndex + 1);
    setFilterQuery(parentPath + key);
    setSuggestionIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSuggestionIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      selectSuggestion(suggestions[suggestionIndex]);
    } else if (e.key === "Escape") {
      setSuggestionIndex(0);
    }
  };

  return (
    <div className="h-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 @sm:px-4 @sm:px-6 py-4 border-b border-zinc-800 flex flex-col @sm:flex-row justify-between items-start @sm:items-center bg-[#0c0c0c] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-black text-white italic tracking-tighter uppercase">JSON Architect</h2>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Structural Analysis & Transformation</div>
          </div>
          
          <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 ml-0 @sm:ml-4">
            <button
              onClick={() => setActiveTab("request")}
              className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${activeTab === "request" ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              Request
            </button>
            <button
              onClick={() => setActiveTab("response")}
              className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${activeTab === "response" ? 'bg-zinc-700 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              Response
            </button>
          </div>
        </div>

        <div className="hidden @sm:flex gap-3 items-center">
            {transformedJson && (
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                        {typeof transformedJson === 'object' && transformedJson !== null ? (Array.isArray(transformedJson) ? transformedJson.length : Object.keys(transformedJson).length) : 1} Nodes Found
                    </span>
                </div>
            )}
        </div>
      </div>

      {/* Transformation Toolbar */}
      <div className="px-4 @sm:px-6 py-3 border-b border-zinc-900 bg-[#080808] flex flex-col @md:flex-row gap-4 items-stretch @md:items-center shrink-0">
        <div className="flex-1 relative">
            <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-1.5 focus-within:border-blue-500/50 transition-all">
                <div className="flex items-center gap-2 shrink-0">
                    <FiSearch className="text-zinc-600 text-sm" />
                    <a 
                        href="https://jmespath.org/tutorial.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[8px] bg-zinc-800 text-zinc-500 px-1 py-0.5 rounded border border-zinc-700 hover:text-blue-400 hover:border-blue-500/30 transition-all font-black uppercase tracking-tighter cursor-help"
                        title="Click for JMESPath language tutorial"
                    >
                        JMESPath
                    </a>
                </div>
                <input 
                    value={filterQuery}
                    onChange={(e) => {
                        setFilterQuery(e.target.value);
                        setSuggestionIndex(0);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholderHint}
                    className="bg-transparent border-none text-xs text-zinc-300 w-full focus:outline-none placeholder:text-zinc-700 font-mono min-w-0"
                />
                {filterQuery && (
                    <button onClick={() => setFilterQuery("")} className="text-zinc-600 hover:text-zinc-400 text-[10px] font-bold uppercase transition-colors">Clear</button>
                )}
            </div>

            {/* Autocomplete Dropdown */}
            {suggestions.length > 0 && filterQuery.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full bg-[#121212] border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    {suggestions.map((s, idx) => (
                        <div 
                            key={s}
                            onClick={() => selectSuggestion(s)}
                            onMouseEnter={() => setSuggestionIndex(idx)}
                            className={`px-3 py-2 text-[10px] font-mono cursor-pointer transition-colors flex items-center justify-between ${idx === suggestionIndex ? 'bg-blue-600/20 text-blue-300' : 'text-zinc-500 hover:bg-zinc-800'}`}
                        >
                            <span>{s}</span>
                            {idx === suggestionIndex && <span className="text-[8px] bg-blue-600 text-white px-1 rounded font-black">ENTER</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="flex gap-2 shrink-0 overflow-x-auto no-scrollbar">
            <button 
                onClick={() => setIsFlattened(!isFlattened)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${isFlattened ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
            >
                <FiLayers className={isFlattened ? "animate-pulse" : ""} />
                Flatten
            </button>
            <button 
                onClick={() => setHideNulls(!hideNulls)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${hideNulls ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
            >
                <FiZap />
                Hide Nulls
            </button>

            <div className="h-6 w-px bg-zinc-800 mx-2 self-center" />

            <div className="flex bg-black rounded-xl p-1 border border-zinc-800">
                <button 
                    onClick={() => setViewType("tree")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all ${viewType === "tree" ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                    <FiEye />
                    Tree
                </button>
                <button 
                    onClick={() => setViewType("raw")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all ${viewType === "raw" ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                    <FiCode />
                    Raw
                </button>
            </div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-4 @sm:p-6 bg-[#0a0a0a]">
        {!rawJson ? (
             <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30 grayscale pointer-events-none">
                <FiLayers className="text-6xl text-zinc-500" />
                <div className="text-center">
                    <div className="text-sm font-black text-zinc-400 uppercase tracking-widest">No JSON Body Detected</div>
                    <div className="text-[10px] text-zinc-600 font-medium">This {activeTab} did not contain a valid JSON payload.</div>
                </div>
            </div>
        ) : transformedJson === undefined ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center max-w-xs">
                    <div className="text-red-400 font-bold text-xs mb-1">Path not found</div>
                    <div className="text-[10px] text-zinc-600 font-medium">The query "{filterQuery}" did not match any nodes in the current tree.</div>
                </div>
            </div>
        ) : (
            <div className="h-full flex flex-col">
                {viewType === "tree" ? (
                    <div className="max-w-5xl w-full mx-auto bg-zinc-900/10 rounded-2xl p-4 border border-zinc-800/50 shadow-inner overflow-auto">
                        <JSONTree 
                            data={transformedJson} 
                            theme={theme}
                            invertTheme={false} 
                            hideRoot={false}
                            labelRenderer={(keyPath: ReadonlyArray<string | number>) => <span className="text-zinc-500 font-mono text-xs">{keyPath[0]}:</span>}
                            valueRenderer={(val: any) => <span className="text-blue-300 font-mono text-xs italic">{String(val)}</span>}
                        />
                    </div>
                ) : (
                    <div className="h-full w-full rounded-2xl border border-zinc-900 overflow-hidden shadow-2xl">
                        <MonacoEditor
                            value={JSON.stringify(transformedJson, null, 2)}
                            language="json"
                            theme="vs-dark"
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 11,
                                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                                lineNumbers: 'off',
                                folding: true,
                                renderLineHighlight: 'none',
                                wordWrap: 'on'
                            }}
                        />
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-2 bg-[#0c0c0c] border-t border-zinc-900 flex justify-between items-center text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
         <div className="flex gap-4">
            <span>Encoding: UTF-8</span>
            <span>Type: application/json</span>
         </div>
         <div className="text-blue-500/50 italic opacity-50">Experimental Transformation Engine v1.0</div>
      </div>
    </div>
  );
};

const Placeholder = ({ text }: { text: string }) => (
  <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a]">
    <div className="text-center">
      <div className="text-5xl font-black opacity-5 mb-4 italic tracking-tighter">JSON TREE</div>
      <div className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-700">{text}</div>
    </div>
  </div>
);
