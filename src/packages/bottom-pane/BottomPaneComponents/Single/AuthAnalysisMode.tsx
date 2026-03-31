import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { decodeBody } from "../../utils/bodyUtils";
import { FiLock, FiShield, FiKey, FiInfo, FiAlertTriangle, FiCheckCircle, FiEdit2 } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { CustomScriptManager } from "./CustomScriptManager";
import { useCustomScripts, AuthFinding } from "./useCustomScripts";

const FindingCard = ({ finding }: { finding: AuthFinding & { isCustom?: boolean, isError?: boolean, scriptName?: string } }) => (
    <div className={twMerge(
        "group overflow-hidden rounded-2xl border transition-all duration-300 shadow-xl mb-4",
        finding.isError 
            ? "border-red-900/50 bg-red-950/10 hover:border-red-500/50" 
            : "border-blue-900/30 bg-blue-950/5 hover:border-blue-500/50"
    )}>
        <div className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <span className={twMerge(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                        finding.isError ? "bg-red-500 text-white" : "bg-blue-600 text-white"
                    )}>
                        {finding.type}
                    </span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Auth Insight</span>
                </div>
                <div className={twMerge(
                    "text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter shadow-sm",
                    finding.isError 
                        ? "bg-red-600 text-white border-red-500" 
                        : "bg-blue-950 text-blue-400 border-blue-900/30"
                )}>
                    {finding.isError ? "Runtime Error" : "Analysis Success"}
                </div>
            </div>
            
            <div className={twMerge(
                "text-sm font-mono p-3 rounded-xl border leading-relaxed",
                finding.isError 
                    ? "text-red-400 bg-red-950/20 border-red-500/20" 
                    : "text-zinc-300 bg-black/30 border-white/5"
            )}>
                {finding.value}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                        {finding.isError ? <FiAlertTriangle size={8} /> : <FiShield size={8} />} {finding.isError ? "Cause" : "Risk"}
                    </div>
                    <div className="text-[10px] text-zinc-400 italic font-medium leading-tight">{finding.risk}</div>
                </div>
                <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                        {finding.isError ? <FiEdit2 size={8} /> : <FiCheckCircle size={8} />} {finding.isError ? "Fix" : "Result"}
                    </div>
                    <div className="text-[10px] text-zinc-400 italic font-medium leading-tight">{finding.solution}</div>
                </div>
            </div>
        </div>
    </div>
);

export const AuthAnalysisMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<RequestPairData | null>(null);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'Analysis' | 'Custom Scripts'>('Analysis');

    const trafficData = useMemo(() => {
        return { body: decodeBody(data?.body || null), headers: data?.headers || [] };
    }, [data]);

    const { customFindings, isRunning } = useCustomScripts<AuthFinding>('auth_analysis', trafficData.body, trafficData.headers);

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
        <div className="bg-[#0a0a0a] overflow-hidden h-full flex flex-col font-sans">
            <div className="px-6 pt-4 border-b border-zinc-900 bg-[#0a0a0a] flex flex-col shadow-lg shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-500">
                            <FiLock size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-tighter">Auth Auditor</h2>
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Session & Token Inspector</div>
                        </div>
                    </div>
                    
                    {tab === 'Analysis' && detectedTokens.length > 1 && (
                        <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 shrink-0">
                            {detectedTokens.map((t, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedTokenIndex(i)}
                                    className={twMerge(
                                        "px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all whitespace-nowrap",
                                        selectedTokenIndex === i ? "bg-blue-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400"
                                    )}
                                >
                                    {t.label || `Token ${i + 1}`}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    {(['Analysis', 'Custom Scripts'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={twMerge(
                                "pb-3 text-[11px] font-black uppercase tracking-widest transition-all relative",
                                tab === t ? t === "Custom Scripts" ? "text-orange-500" : "text-blue-500" : "text-zinc-600 hover:text-zinc-400"
                            )}
                        >
                            {t}
                            {tab === t && (
                                <div className={twMerge(
                                    "absolute bottom-0 left-0 right-0 h-0.5 shadow-lg",
                                    t === "Custom Scripts" ? "bg-orange-500 shadow-orange-500/50" : "bg-blue-500 shadow-blue-500/50"
                                )} />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow overflow-auto pb-10 custom-scrollbar">
                <div className="max-w-4xl mx-auto p-4 @sm:p-8 space-y-8">
                    {tab === 'Custom Scripts' ? (
                        <CustomScriptManager category="auth_analysis" />
                    ) : (
                        <>
                            {customFindings.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4 pl-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                            <FiShield size={12} /> Custom Auth Insights
                                        </div>
                                        {isRunning && <span className="text-[10px] text-blue-500 animate-pulse font-black uppercase">Executing...</span>}
                                    </div>
                                    {customFindings.map((f, i) => <FindingCard key={i} finding={f} />)}
                                </div>
                            )}

                            {detectedTokens.length === 0 && cookies.length === 0 ? (
                                <div className="py-20 text-center bg-zinc-900/10 rounded-3xl border border-dashed border-zinc-800/50">
                                    <div className="text-zinc-500 text-sm italic font-medium">No standard authentication tokens detected.</div>
                                    <div className="text-[10px] text-zinc-700 uppercase font-black tracking-widest mt-4">Scanned: Headers, Cookies, JSON Body</div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {activeDetails?.jwt && (
                                        <div className="space-y-4">
                                            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
                                                <div className="px-6 py-4 bg-zinc-800/50 border-b border-zinc-800 flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <FiKey className="text-blue-500" />
                                                        <span className="text-xs font-black uppercase text-zinc-300 tracking-tighter">{activeDetails.label || 'Token'} Payload</span>
                                                        <span className="text-[8px] bg-zinc-950 text-zinc-500 px-2 py-1 rounded-lg font-mono uppercase tracking-widest border border-white/5">{activeDetails.source}</span>
                                                    </div>
                                                    <span className="text-[9px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full font-black tracking-widest uppercase border border-blue-500/20">Auto-Decoded</span>
                                                </div>
                                                <div className="p-6 overflow-auto max-h-[500px] bg-black/40">
                                                    <pre className="text-xs text-blue-300/60 font-mono leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30">
                                                        {JSON.stringify(activeDetails.jwt, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 @sm:grid-cols-3 gap-4">
                                                <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-3xl group hover:border-blue-500/30 transition-all shadow-lg">
                                                    <div className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest opacity-60">Algorithm</div>
                                                    <div className="text-sm font-black text-white italic tracking-tighter">{activeDetails.token?.split('.')[0] ? (JSON.parse(atob(activeDetails.token.split('.')[0])).alg || 'Unknown') : 'Unknown'}</div>
                                                </div>
                                                <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-3xl group hover:border-blue-500/30 transition-all shadow-lg">
                                                    <div className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest opacity-60">Issued At (iat)</div>
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-black text-white uppercase italic tracking-tighter">
                                                            {activeDetails.jwt.iat ? new Date(activeDetails.jwt.iat * 1000).toUTCString().replace('GMT', '') : 'N/A'}
                                                            <span className="ml-1 text-[8px] text-blue-500/50">UTC</span>
                                                        </div>
                                                        <div className="text-[10px] text-zinc-600 font-medium italic">
                                                            {activeDetails.jwt.iat ? new Date(activeDetails.jwt.iat * 1000).toLocaleString() : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-3xl group hover:border-blue-500/30 transition-all shadow-lg">
                                                    <div className="text-[10px] font-black text-zinc-500 uppercase mb-2 tracking-widest opacity-60">Expires (exp)</div>
                                                    <div className="space-y-1">
                                                        <div className="text-xs font-black text-white uppercase italic tracking-tighter">
                                                            {activeDetails.jwt.exp ? new Date(activeDetails.jwt.exp * 1000).toUTCString().replace('GMT', '') : 'N/A'}
                                                            <span className="ml-1 text-[8px] text-blue-500/50">UTC</span>
                                                        </div>
                                                        <div className="text-[10px] text-zinc-600 font-medium italic">
                                                            {activeDetails.jwt.exp ? new Date(activeDetails.jwt.exp * 1000).toLocaleString() : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {cookies.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest pl-2 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-pulse" />
                                                Session Cookies ({cookies.length})
                                            </h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {cookies.map((c, i) => (
                                                    <div key={i} className="bg-zinc-900/50 border border-white/5 px-5 py-3 rounded-2xl text-xs font-mono text-zinc-400 break-all shadow-lg hover:border-blue-500/20 transition-all group">
                                                        <span className="text-zinc-600 group-hover:text-blue-500/50 transition-colors mr-2">/&gt;</span>
                                                        {c}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 bg-blue-900/10 border border-blue-900/20 rounded-3xl shadow-inner relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                            <FiShield size={80} className="rotate-12" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Auditor Security Advice</h4>
                                        <p className="text-[11px] text-zinc-500 leading-relaxed italic max-w-2xl">
                                            {activeDetails?.label === 'Refresh Token' ? 
                                                'CRITICAL: Refresh tokens are highly sensitive long-lived credentials. They must be stored in secure HTTP-only cookies or encrypted local storage and require rotation policies to prevent replay attacks.' : 
                                                'ADVICE: Access tokens should be ephemeral with low expiry times. Ensure they are not leaked in URL parameters or browser history. Use PKCE for mobile/public clients.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] p-10 text-center font-sans">
        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 mb-8 shadow-2xl relative group">
            <FiLock size={32} className="group-hover:text-blue-500 transition-colors" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full animate-ping opacity-20"></div>
        </div>
        <h3 className="text-zinc-400 font-black mb-2 italic tracking-tight uppercase">Auth Inspector Ready</h3>
        <p className="text-[11px] text-zinc-600 leading-relaxed max-w-[200px] uppercase font-bold tracking-widest">{text}</p>
    </div>
);

export default AuthAnalysisMode;
