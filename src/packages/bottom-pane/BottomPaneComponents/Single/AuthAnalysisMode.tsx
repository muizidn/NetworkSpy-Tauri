import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";

export const AuthAnalysisMode = () => {
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<RequestPairData | null>(null);
    const [loading, setLoading] = useState(false);
  
    useEffect(() => {
      if (!trafficId) return;
      setLoading(true);
      invoke<RequestPairData>("get_request_pair_data", { trafficId })
        .then((res) => setData(res))
        .finally(() => setLoading(false));
    }, [trafficId]);

    const authDetails = useMemo(() => {
        if (!data) return null;
        const authHeader = data.headers.find(h => h.key.toLowerCase() === 'authorization');
        const cookieHeader = data.headers.find(h => h.key.toLowerCase() === 'cookie');
        
        const details: any = { type: 'None' };
        
        if (authHeader) {
            const val = authHeader.value;
            if (val.startsWith('Bearer ')) {
                details.type = 'Bearer Token';
                details.token = val.split(' ')[1];
                // Try decode JWT
                try {
                    const parts = details.token.split('.');
                    if (parts.length === 3) {
                        details.jwt = JSON.parse(atob(parts[1]));
                    }
                } catch (e) {}
            } else if (val.startsWith('Basic ')) {
                details.type = 'Basic Auth';
                try { details.decoded = atob(val.split(' ')[1]); } catch(e) {}
            } else {
                details.type = 'Other Header';
                details.value = val;
            }
        } else if (cookieHeader) {
            details.type = 'Cookie Based';
            details.cookies = cookieHeader.value.split(';').map(c => c.trim());
        }

        return details;
    }, [data]);

    if (!trafficId) return <Placeholder text="Select a request to analyze authentication" />;
    if (loading) return <Placeholder text="Loading data..." />;

    return (
        <div className="h-full bg-[#0a0a0a] p-6 overflow-auto">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white italic tracking-tighter">Auth Auditor</h2>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Identity & Session Token Analysis</div>
                    </div>
                    <div className="bg-blue-600 px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest">
                        {authDetails?.type || 'Searching...'}
                    </div>
                </div>

                {!authDetails || authDetails.type === 'None' ? (
                    <div className="py-12 text-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                        <div className="text-zinc-500 text-sm">No standard authorization headers or cookies found.</div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {authDetails.jwt && (
                            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                                <div className="px-5 py-3 bg-zinc-800/50 border-b border-zinc-800 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-zinc-400">JWT Payload (Decoded)</span>
                                    <span className="text-[8px] bg-blue-500 text-white px-1.5 rounded">AUTO-DECODED</span>
                                </div>
                                <div className="p-5 overflow-auto">
                                    <pre className="text-xs text-blue-300 font-mono leading-relaxed">
                                        {JSON.stringify(authDetails.jwt, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {authDetails.cookies && (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest pl-2">Detected Cookies</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {authDetails.cookies.map((c: string, i: number) => (
                                        <div key={i} className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-xs font-mono text-zinc-400 break-all">
                                            {c}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-5 bg-blue-900/10 border border-blue-900/20 rounded-2xl">
                            <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Security Advice</h4>
                            <p className="text-xs text-zinc-500 leading-relaxed italic">
                                {authDetails.type === 'Bearer Token' ? 'Token should be rotated hourly and stored in HttpOnly cookies if possible.' : 'Consider migrating to Bearer tokens for stateless microservices.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a]">
        <div className="text-center">
            <div className="text-4xl font-black opacity-10 mb-2">AUTH</div>
            <div className="text-sm">{text}</div>
        </div>
    </div>
);
