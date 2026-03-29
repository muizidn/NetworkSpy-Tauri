import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useMemo, useState } from "react";

export const AISecurityMode = () => {
    const { selections } = useTrafficListContext();
    const selectedItems = selections.others || [];
    const [generating, setGenerating] = useState(false);
    const [report, setReport] = useState<string | null>(null);

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => {
            setReport(`AI Comprehensive Security Audit Report:

[1. BROKEN OBJECT LEVEL AUTHORIZATION (BOLA)]
Detected likely BOLA vulnerability in /api/users/:id. The numeric IDs are incremental, allowing easy enumeration. AI noticed that requests with ID offsets did not verify ownership headers.

[2. SECURITY MISCONFIGURATION]
30% of selected requests are missing 'X-Frame-Options' and 'Content-Security-Policy'. Server header exposes 'Nginx/1.24.1' which is vulnerable to CVE-2023-xxxx.

[3. INJECTION RISKS]
The 'search' parameter in /api/catalog is reflected directly in the response without sanitization. Potential Reflected XSS.

[4. RECOMMENDATION]
- Implement UUIDs instead of incremental IDs.
- Harden backend security headers.
- Sanitize all reflected input.`);
            setGenerating(false);
        }, 2200);
    };

    if (selectedItems.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-zinc-950 text-red-100 p-6 sm:p-10 text-center">
          <div className="text-4xl opacity-10 font-black mb-4">SEC AUDITOR</div>
          <p className="text-sm max-w-xs text-zinc-600">Select multiple requests to generate an AI-integrated security audit.</p>
        </div>
      );
    }

    return (
      <div className="h-full bg-zinc-950 p-4 sm:p-6 flex flex-col items-center overflow-auto">
        <div className="max-w-3xl w-full">
          <div className="flex items-center gap-4 mb-10 pb-6 border-b border-zinc-900">
              <div className="w-16 h-16 rounded-full bg-red-950/30 flex items-center justify-center text-red-500 border border-red-900/40">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m0 0v3m0-3h3m-3 0H9m12 1a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">AI Security Auditor</h2>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">Deep heuristic vulnerability analysis for {selectedItems.length} items</div>
              </div>
          </div>

          {!report ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center shadow-2xl">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-zinc-200 font-bold text-lg mb-2">Ready for a Deep Scan?</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed mb-8">AI will analyze patterns across all selected requests to identify OWASP top 10 risks including Broken Auth, Injections, and Sensitive Data Leaks.</p>
                    <button 
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-red-900/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {generating && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                        {generating ? 'Running Heuristic Audit...' : 'Start Comprehensive AI Audit'}
                    </button>
                  </div>
              </div>
          ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Executive Security Summary
                      </span>
                      <button onClick={() => setReport(null)} className="text-[10px] text-zinc-600 font-bold hover:text-white uppercase">Re-scan</button>
                  </div>
                  <div className="prose prose-invert prose-sm">
                      <pre className="whitespace-pre-wrap text-zinc-300 font-sans leading-relaxed text-sm bg-black/40 p-4 sm:p-6 rounded-xl border border-zinc-800">
                          {report}
                      </pre>
                  </div>
                  <div className="mt-8 flex gap-4">
                      <div className="flex-grow bg-red-900/10 border border-red-900/20 rounded-xl p-4">
                          <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Risk Level</div>
                          <div className="text-xl font-bold text-white">CRITICAL</div>
                      </div>
                      <div className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                          <button className="text-[10px] font-black text-zinc-500 hover:text-white uppercase transition-colors h-full w-full">Export PDF Report</button>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>
    );
};
