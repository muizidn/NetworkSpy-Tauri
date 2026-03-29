import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { decodeBody } from "../../utils/bodyUtils";

export const AuthAnalysisMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<RequestPairData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        provider.getRequestPairData(trafficId)
            .then((res) => setData(res))
            .finally(() => setLoading(false));
    }, [trafficId, provider]);

    const jwtRegex = /ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g;

    const detectedTokens = useMemo(() => {
        if (!data) return [];
        const tokens: { source: string, token: string, label?: string }[] = [];

        // 1. Check Authorization Header
        const authHeader = data.headers.find(h => h.key?.toLowerCase() === 'authorization');
        if (authHeader?.value?.startsWith('Bearer ')) {
            const token = authHeader.value.split(' ')[1];
            if (token.match(jwtRegex)) {
                tokens.push({ source: 'Header: Authorization', token, label: 'Access Token' });
            }
        }

        // 2. Check Other Headers
        data.headers.forEach(h => {
             const key = h.key?.toLowerCase();
             if (key === 'authorization') return;
             const val = String(h.value || "");
             const matches = val.match(jwtRegex);
             if (matches) {
                 matches.forEach(m => {
                     if (m.split('.').length >= 2 && !tokens.some(t => t.token === m)) {
                         tokens.push({ source: `Header: ${h.key}`, token: m, label: key.includes('refresh') ? 'Refresh Token' : undefined });
                     }
                 });
             }
        });

        // 3. Check Body
        const decodedBody = decodeBody(data.body);
        if (decodedBody) {
            try {
                const bodyJson = JSON.parse(decodedBody);
                Object.entries(bodyJson).forEach(([k, v]) => {
                    if (typeof v === 'string' && v.match(jwtRegex)) {
                        if (v.split('.').length >= 2 && !tokens.some(t => t.token === v)) {
                            tokens.push({ source: `Body: ${k}`, token: v, label: k.toLowerCase().includes('refresh') ? 'Refresh Token' : 'Access Token' });
                        }
                    }
                });
            } catch (e) {
                const matches = decodedBody.match(jwtRegex);
                if (matches) {
                    matches.forEach(m => {
                        if (m.split('.').length >= 2 && !tokens.some(t => t.token === m)) {
                            tokens.push({ source: `Body (Regex)`, token: m });
                        }
                    });
                }
            }
        }

        return tokens;
    }, [data]);

    const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
    
    // Reset selected token when traffic changes
    useEffect(() => {
        setSelectedTokenIndex(0);
    }, [trafficId]);

    const activeDetails = useMemo(() => {
        const t = detectedTokens[selectedTokenIndex];
        if (!t) return null;
        
        let jwt = null;
        try {
            const parts = t.token.split('.');
            if (parts.length >= 2) {
                jwt = JSON.parse(atob(parts[1]));
            }
        } catch (e) {}

        return { ...t, jwt };
    }, [detectedTokens, selectedTokenIndex]);

    const cookies = useMemo(() => {
        if (!data) return [];
        const cookieHeader = data.headers.find(h => h.key?.toLowerCase() === 'cookie');
        if (!cookieHeader || !cookieHeader.value) return [];
        return String(cookieHeader.value).split(';').map(c => c.trim());
    }, [data]);

    if (!trafficId) return <Placeholder text="Select a request to analyze authentication" />;
    if (loading) return <Placeholder text="Loading data..." />;

    return (
        <div className="bg-[#0a0a0a] overflow-hidden h-full flex flex-col">
            <div className="px-4 sm:px-4 sm:px-6 py-4 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-end bg-[#0c0c0c] shrink-0 gap-4">
                <div>
                    <h2 className="text-xl font-black text-white italic tracking-tighter uppercase font-mono">Auth Auditor</h2>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Session & Token Inspector</div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {detectedTokens.length > 1 && (
                        <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 shrink-0">
                            {detectedTokens.map((t, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedTokenIndex(i)}
                                    className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all whitespace-nowrap ${selectedTokenIndex === i ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    {t.label || `Token ${i + 1}`}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-grow overflow-auto p-4 sm:p-4 sm:p-6 space-y-6">
                <div className="max-w-4xl mx-auto space-y-8">
                {detectedTokens.length === 0 && cookies.length === 0 ? (
                    <div className="py-20 text-center bg-zinc-900/10 rounded-3xl border border-dashed border-zinc-800/50">
                        <div className="text-zinc-500 text-sm italic">No authentication tokens detected in this exchange.</div>
                        <div className="text-[10px] text-zinc-700 uppercase font-bold tracking-widest mt-2">Scanned: Headers, Cookies, Body</div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {activeDetails?.jwt && (
                            <div className="space-y-4">
                                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                                    <div className="px-5 py-3 bg-zinc-800/50 border-b border-zinc-800 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">{activeDetails.label || 'Token'} Payload</span>
                                            <span className="text-[8px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-widest">{activeDetails.source}</span>
                                        </div>
                                        <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-black tracking-widest uppercase border border-blue-500/20 shadow-inner">AUTO-DECODED</span>
                                    </div>
                                    <div className="p-5 overflow-auto max-h-[400px]">
                                        <pre className="text-xs text-blue-300/80 font-mono leading-relaxed whitespace-pre-wrap">
                                            {JSON.stringify(activeDetails.jwt, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl group hover:border-blue-500/30 transition-colors">
                                        <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1 tracking-widest">Algorithm</div>
                                        <div className="text-sm font-black text-white">{activeDetails.token?.split('.')[0] ? (JSON.parse(atob(activeDetails.token.split('.')[0])).alg || 'Unknown') : 'Unknown'}</div>
                                    </div>
                                    <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl group hover:border-blue-500/30 transition-colors">
                                        <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1 tracking-widest">Issued At (iat)</div>
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-black text-white">
                                                {activeDetails.jwt.iat ? new Date(activeDetails.jwt.iat * 1000).toUTCString() : 'N/A'}
                                                <span className="ml-2 text-[8px] text-blue-500/50 font-bold uppercase tracking-tighter">UTC</span>
                                            </div>
                                            <div className="text-[9px] text-zinc-500 font-mono italic">
                                                {activeDetails.jwt.iat ? new Date(activeDetails.jwt.iat * 1000).toLocaleString() : 'N/A'}
                                                <span className="ml-1 text-[7px] text-zinc-700 font-bold uppercase">Local</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl group hover:border-blue-500/30 transition-colors">
                                        <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1 tracking-widest">Expires (exp)</div>
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-black text-white">
                                                {activeDetails.jwt.exp ? new Date(activeDetails.jwt.exp * 1000).toUTCString() : 'N/A'}
                                                <span className="ml-2 text-[8px] text-blue-500/50 font-bold uppercase tracking-tighter">UTC</span>
                                            </div>
                                            <div className="text-[9px] text-zinc-500 font-mono italic">
                                                {activeDetails.jwt.exp ? new Date(activeDetails.jwt.exp * 1000).toLocaleString() : 'N/A'}
                                                <span className="ml-1 text-[7px] text-zinc-700 font-bold uppercase">Local</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {cookies.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest pl-2">Detected Cookies</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {cookies.map((c, i) => (
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
                                {activeDetails?.label === 'Refresh Token' ? 
                                    'Refresh tokens are sensitive and should be limited to single-use (rotation) and high security storage.' : 
                                    'Access tokens should have short TTLs and be passed only over secure channels. Check for rotation logic if multi-token response detected.'}
                            </p>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a]">
        <div className="text-center">
            <div className="text-4xl font-black opacity-10 mb-2 font-mono">AUTH</div>
            <div className="text-sm uppercase tracking-widest text-zinc-700 font-bold">{text}</div>
        </div>
    </div>
);
