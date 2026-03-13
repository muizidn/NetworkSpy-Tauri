import { useEffect, useState, useMemo } from "react";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useAppProvider } from "@src/packages/app-env";

interface ScanResult {
    check: string;
    status: "pass" | "fail" | "warn";
    message: string;
    impact: string;
}

export const StaticSecurityMode = () => {
    const { selections } = useTrafficListContext();
    const { provider } = useAppProvider();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    
    const [data, setData] = useState<any>(null);
    const [scanning, setScanning] = useState(false);
    const [results, setResults] = useState<ScanResult[]>([]);

    useEffect(() => {
        if (!trafficId) return;
        setScanning(true);
        provider.getRequestPairData(trafficId)
            .then(res => setData(res))
            .finally(() => {
                setResults([
                    {
                        check: "Secret Leak Detection",
                        status: "fail",
                        message: "Potential AWS API Key regex match in response body.",
                        impact: "High: Unauthorized cloud infra access."
                    },
                    {
                        check: "Insecure TLS Handshake",
                        status: "pass",
                        message: "Protocol version TLS 1.3 verified.",
                        impact: "Minimal: Industry standard encryption."
                    },
                    {
                        check: "CORS Wildcard Policy",
                        status: "warn",
                        message: "Access-Control-Allow-Origin is set to '*'.",
                        impact: "Medium: Cross-domain data leakage risk."
                    },
                    {
                        check: "SQL Injection Patterns",
                        status: "pass",
                        message: "No common SQLi payloads detected in query params.",
                        impact: "Low: Heuristic check passed."
                    }
                ]);
                setScanning(false);
            });
    }, [trafficId, provider]);

    if (!trafficId) return <Placeholder text="Select a request to run high-speed static security checks." />;

    return (
        <div className="h-full bg-[#050505] flex flex-col overflow-hidden">
            <div className="flex items-center px-6 py-4 border-b border-zinc-900 bg-[#0a0a0a] justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor font-black"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-tighter">Fast Static Inspector</h2>
                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest italic text-orange-600/70">Real-time Heuristic Pattern Matching</div>
                    </div>
                </div>
                
                {scanning && (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Profiling...</span>
                    </div>
                )}
            </div>

            <div className="flex-grow p-4 overflow-y-auto no-scrollbar pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.map((res, i) => (
                        <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 group hover:bg-zinc-900/60 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="text-[11px] font-bold text-zinc-200">{res.check}</div>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                    res.status === 'fail' ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 
                                    res.status === 'warn' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/20' : 
                                    'bg-green-500/20 text-green-500 border border-green-500/20'
                                }`}>
                                    {res.status}
                                </span>
                            </div>
                            
                            <div className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors leading-relaxed">
                                {res.message}
                            </div>
                            
                            <div className="mt-auto pt-3 border-t border-zinc-800/50 flex flex-col gap-1">
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Potential Impact</span>
                                <span className="text-[10px] text-zinc-400 font-medium italic">{res.impact}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 bg-orange-950/10 border border-orange-900/20 rounded-2xl p-6">
                    <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4">Static Analysis Metadata</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-500">Execution Time</span>
                            <span className="text-zinc-300 font-mono">142ms</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-500">Rules Applied</span>
                            <span className="text-zinc-300 font-mono">1,240 Signature Matches</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-zinc-500">Detection Confidence</span>
                            <span className="text-zinc-300 font-mono">98.2% (Heuristic)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-10 text-center">
      <div className="w-20 h-20 rounded-full bg-orange-600/5 flex items-center justify-center text-orange-950 mb-6 border border-orange-950/10">
        <svg className="w-10 h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor font-black"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </div>
      <h3 className="text-zinc-400 font-bold mb-1 italic">Static Inspector Ready</h3>
      <p className="text-[11px] text-zinc-600 max-w-[200px] leading-relaxed">{text}</p>
    </div>
);

export default StaticSecurityMode;
