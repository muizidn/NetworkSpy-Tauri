import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useMemo, useState } from "react";

export const AIInvestigateMode = () => {
  const { selections } = useTrafficListContext();
  const selectedItems = selections.others || [];
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  const handleInvestigate = () => {
    if (!query) return;
    setLoading(true);
    setTimeout(() => {
      setAnswer(`Observation based on ${selectedItems.length} items:
1. The 401 Unauthorized errors are consistently coming from the /api/admin/* endpoints.
2. The 'Authorization' header is present but the token prefix 'Bearer' is missing in 3 requests.
3. Latency spikes (approx 1.2s) occur when the payload exceeds 500KB.
4. Recommendation: Ensure token formatting is consistent and consider payload compression.`);
      setLoading(false);
    }, 2000);
  };

  if (selectedItems.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#050505] text-indigo-200 p-6 @sm:p-10 text-center">
        <div className="text-4xl opacity-10 font-black mb-4">AI INVESTIGATOR</div>
        <p className="text-sm max-w-xs text-zinc-600">Select multiple requests and ask specific questions about their behavior.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#050505] p-4 @sm:p-6 flex flex-col items-center overflow-auto">
      <div className="max-w-3xl w-full">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 p-[1px]">
            <div className="bg-[#050505] w-full h-full rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" /></svg>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">AI Investigator</h2>
            <div className="text-[10px] text-zinc-500 font-bold tracking-widest">Deep Analysis Context: {selectedItems.length} Items</div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 @sm:p-6 shadow-2xl mb-8">
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-zinc-400 pl-1">What would you like to know?</span>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Why am I getting 401 errors? or Which endpoint is slowest?"
                className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-xl px-4 py-4 pr-16 text-sm text-zinc-300 focus:outline-none focus:border-indigo-600 transition-all placeholder:text-zinc-600"
                onKeyDown={(e) => e.key === 'Enter' && handleInvestigate()}
              />
              <button
                onClick={handleInvestigate}
                disabled={loading || !query}
                className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Ask AI'}
              </button>
            </div>
          </div>
        </div>

        {answer && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-black text-zinc-500 tracking-[0.3em]">Investigation Results</span>
            </div>
            <div className="prose prose-invert prose-sm">
              <pre className="whitespace-pre-wrap text-zinc-300 font-sans leading-loose text-sm">
                {answer}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
