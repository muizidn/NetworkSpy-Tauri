import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";

export const SensitiveDataMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<RequestPairData | null>(null);
    const [leaks, setLeaks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        provider.getRequestPairData(trafficId)
            .then((res) => {
                setData(res);
                // Simulate detector
                const found = [];
                const body = res.body || "";

                // Basic regex patterns
                if (body.match(/eyJh/)) found.push({ type: 'JWT Token', value: 'Found in body' });
                if (body.match(/api_key|apikey|x-api-key/i)) found.push({ type: 'API Key', value: 'Key name detected' });
                if (body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) found.push({ type: 'Email Address', value: 'PII Leakage' });
                if (body.match(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/)) found.push({ type: 'Credit Card', value: 'Payment data' });

                res.headers.forEach(h => {
                    if (h.key.toLowerCase().match(/authorization|cookie|session/)) {
                        found.push({ type: 'Auth Header', value: h.key, location: 'Headers' });
                    }
                });

                setLeaks(found);
            })
            .finally(() => setLoading(false));
    }, [trafficId, provider]);

    if (!trafficId) return <Placeholder text="Select a request to scan for leaks" />;
    if (loading) return <Placeholder text="Analyzing payload..." />;

    return (
        <div className="h-full bg-zinc-950 p-6 overflow-auto">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center text-orange-500 border border-orange-600/30">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0H9m12 1a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Sensitive Data Detector</h2>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Scanning Body & Headers for PII/Secrets</div>
                    </div>
                </div>

                {leaks.length === 0 ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
                        <div className="text-green-500 font-bold mb-1">No Sensitive Data Detected</div>
                        <div className="text-xs text-zinc-500 italic">No common patterns for keys, tokens, or PII found in visible payload.</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {leaks.map((leak, i) => (
                            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center group hover:border-orange-900 transition-colors">
                                <div>
                                    <div className="text-[10px] font-black uppercase text-orange-500 mb-1">{leak.type}</div>
                                    <div className="text-sm font-mono text-zinc-300">{leak.value}</div>
                                    {leak.location && <div className="text-[9px] text-zinc-600 bg-zinc-800 inline-block px-1 rounded mt-1">{leak.location}</div>}
                                </div>
                                <div className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">POTENTIAL RISK</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-zinc-950">
        <div className="text-center">
            <div className="text-4xl font-black opacity-10 mb-2 italic">SECURE</div>
            <div className="text-sm">{text}</div>
        </div>
    </div>
);
