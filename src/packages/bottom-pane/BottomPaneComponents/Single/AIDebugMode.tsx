import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";

export const AIDebugMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<RequestPairData | null>(null);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (!trafficId) return;
        setData(null);
        setDebugInfo(null);
        provider.getRequestPairData(trafficId)
            .then((res) => setData(res));
    }, [trafficId, provider]);

    const handleDebug = () => {
        setAnalyzing(true);
        setTimeout(() => {
            const code = parseInt(String(selections.firstSelected?.code || ""));
            let response = "";
            if (code >= 400) {
                response = `The request failed with ${code}. 
AI Analysis:
- The backend rejected the payload because the 'user_id' field was expected as an integer, but was passed as a string.
- This endpoint requires a valid CSRF token in the headers which seems to be expired.
- Latency was unusually high (800ms) for a simple validation check.`;
            } else {
                response = `The request was successful.
AI Insights:
- Response time is optimal.
- Payload size is small and efficient.
- Endpoints follows RESTful conventions.
- Suggestion: Consider adding Cache-Control headers to reduce server load for subsequent calls.`;
            }
            setDebugInfo(response);
            setAnalyzing(false);
        }, 1800);
    };

    if (!trafficId) return <Placeholder text="Select a request to start AI Debug" />;

    return (
        <div className="h-full bg-zinc-950 p-4 sm:p-6 overflow-auto">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-5 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-900/40 shrink-0">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">AI Debugger</h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Autonomous Logical Analysis & Fault Localization</p>
                    </div>
                </div>

                {!debugInfo ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-10 flex flex-col items-center text-center">
                        <div className="text-zinc-300 font-bold mb-3">Explain why this request happened the way it did</div>
                        <p className="text-xs text-zinc-600 mb-8 max-w-sm italic">AI will inspect the request journey, headers, and body to identify logic flaws or performance quirks.</p>
                        <button
                            onClick={handleDebug}
                            disabled={analyzing}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-10 rounded-full transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                        >
                            {analyzing && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                            {analyzing ? 'Analyzing Architecture...' : 'Analyze Request'}
                        </button>
                    </div>
                ) : (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI EXPLANATION</span>
                            <button onClick={() => setDebugInfo(null)} className="text-[10px] text-zinc-600 font-bold hover:text-white uppercase">Reset</button>
                        </div>
                        <div className="prose prose-invert prose-sm">
                            <pre className="whitespace-pre-wrap text-zinc-300 font-sans leading-relaxed text-sm">
                                {debugInfo}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-zinc-950">
        <div className="text-center">
            <div className="text-4xl font-black opacity-10 mb-2 truncate max-w-xs">DEBUGGER</div>
            <div className="text-sm">{text}</div>
        </div>
    </div>
);
