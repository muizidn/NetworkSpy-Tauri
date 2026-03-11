import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useMemo, useState } from "react";

export const AISummaryMode = () => {
  const { selections } = useTrafficListContext();
  const selectedItems = selections.others || [];
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleGenerate = () => {
    setGenerating(true);
    // Mimic API call
    setTimeout(() => {
      setSummary(`AI Insights for ${selectedItems.length} requests:
- Most requests were successful (200 OK)
- Significant latency detected in /api/v1/auth
- Authentication token is sent in 80% of requests
- Data format consists of JSON with structured message fields
- Possible duplicate requests detected for /api/v1/settings`);
      setGenerating(false);
    }, 2000);
  };

  if (selectedItems.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-zinc-950 text-sky-200">
        <div className="text-4xl opacity-10 font-black mb-4">AI ANALYZER</div>
        <div className="text-sm">Select multiple requests to generate an AI Summary</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-zinc-950 p-6 flex flex-col items-center overflow-auto">
      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">AI Traffic Analyzer</h2>
            <div className="text-xs text-indigo-400 font-semibold">{selectedItems.length} Items Selected</div>
          </div>
        </div>

        {summary ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="prose prose-invert prose-sm">
               <pre className="whitespace-pre-wrap text-zinc-300 font-sans leading-relaxed">
                  {summary}
               </pre>
            </div>
            <button 
              onClick={() => { setSummary(null); }}
              className="text-xs font-bold text-zinc-500 hover:text-white transition-colors"
            >
              ← Generate New Summary
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 flex flex-col items-center gap-6 text-center">
             <div className="space-y-2">
                <div className="text-zinc-200 font-semibold">Ready to distill traffic data?</div>
                <div className="text-sm text-zinc-500">Our AI will analyze methods, status codes, and payload patterns to provide a concise overview of the selected traffic items.</div>
             </div>
             <button
                onClick={handleGenerate}
                disabled={generating}
                className="group relative inline-flex items-center gap-3 bg-white text-zinc-950 px-8 py-3 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all w-full md:w-auto shadow-xl"
             >
                {generating ? (
                   <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing Patterns...</span>
                   </>
                ) : (
                   <>
                      <span>Summarize with AI</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                   </>
                )}
             </button>
          </div>
        )}

        {/* Selected Items List Previews */}
        <div className="mt-12">
            <div className="text-[10px] font-black uppercase text-zinc-600 mb-3 tracking-widest pl-2">Selected Items Coverage</div>
            <div className="space-y-1 opacity-50">
               {selectedItems.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs bg-zinc-900/30 p-2 rounded hover:bg-zinc-900 transition-colors">
                     <span className="text-zinc-500 w-4 font-mono">{i+1}</span>
                     <span className={`px-1.5 py-0.5 rounded-[4px] font-mono text-[10px] bg-zinc-800`}>{item.method}</span>
                     <span className="text-zinc-400 truncate flex-grow italic">{String(item.url || "")}</span>
                  </div>
               ))}
               {selectedItems.length > 5 && (
                  <div className="text-center py-2 text-zinc-600 text-[10px]">And {selectedItems.length - 5} more items...</div>
               )}
            </div>
        </div>
      </div>
    </div>
  );
};
