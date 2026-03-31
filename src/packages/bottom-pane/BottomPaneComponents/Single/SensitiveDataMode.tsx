import { useAppProvider } from "@src/packages/app-env";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiShield, FiAlertTriangle, FiEdit2 } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { decodeBody } from "../../utils/bodyUtils";
import { CustomScriptManager } from "./CustomScriptManager";
import { useCustomScripts, SensitiveDataFinding } from "./useCustomScripts";

const LEAK_METADATA: Record<string, { risk: string, solution: string }> = {
    'JWT Token': {
        risk: 'JWT tokens in response bodies can be logged by caches, proxies, or browser history, leading to unauthorized account access if intercepted.',
        solution: 'Pass tokens via secure, HttpOnly cookies or use short-lived access tokens with refresh token rotation.'
    },
    'API Key': {
        risk: 'Exposed API keys allow third parties to make requests on your behalf, potentially leading to data theft or unexpected billing.',
        solution: 'Rotate keys immediately. Use environment variables on the backend and never expose master keys to the frontend.'
    },
    'Email Address': {
        risk: 'Personally Identifiable Information (PII) leakage violates privacy regulations like GDPR or CCPA and can be used for phishing attacks.',
        solution: 'Anonymize or mask email addresses in responses (e.g., u***r@example.com) unless absolutely necessary for the client.'
    },
    'Credit Card': {
        risk: 'Transmission of raw credit card numbers (PAN) is a severe PCI-DSS violation. If intercepted, it allows for direct financial fraud.',
        solution: 'Use payment processors (like Stripe) that provide tokens instead of raw numbers. Never store or transmit full credit card digits.'
    },
    'Auth Header': {
        risk: 'Authorization headers containing secrets are sensitive. While standard, they must be transmitted over TLS 1.2+ to prevent sniffing.',
        solution: 'Ensure all authenticated endpoints enforce HTTPS. Use Bearer tokens with limited scopes instead of static Basic auth.'
    }
};

const FindingCard = ({ finding }: { finding: SensitiveDataFinding & { isCustom?: boolean, isError?: boolean, scriptName?: string } }) => (
    <div className={twMerge(
        "group overflow-hidden rounded-3xl border transition-all duration-300 shadow-xl",
        finding.isError 
            ? "border-red-900/50 bg-red-950/10 hover:border-red-500/50" 
            : "border-zinc-800 bg-zinc-900/40 hover:border-orange-900/50"
    )}>
        <div className="p-4 @sm:p-6 flex flex-col @md:flex-row gap-4 @sm:p-6">
            <div className="flex-grow space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={twMerge(
                                "text-xs font-black uppercase tracking-widest",
                                finding.isError ? "text-red-500" : "text-orange-500"
                            )}>
                                {finding.type}
                            </span>
                            <span className="px-2 py-0.5 bg-black/50 text-[9px] text-zinc-500 rounded-full border border-zinc-800 uppercase font-bold">{finding.location}</span>
                            {finding.isCustom && <span className="px-2 py-0.5 bg-blue-950/30 text-[9px] text-blue-500 rounded-full border border-blue-900/30 uppercase font-black tracking-tighter">Custom</span>}
                        </div>
                        <div className={twMerge(
                            "text-sm font-mono mt-2 break-all p-3 rounded-xl border",
                            finding.isError 
                                ? "text-red-400 bg-red-950/20 border-red-500/20" 
                                : "text-zinc-300 bg-black/30 border-white/5"
                        )}>
                            {finding.value}
                        </div>
                    </div>
                    <div className={twMerge(
                        "text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-tighter shadow-sm animate-pulse",
                        finding.isError 
                            ? "bg-red-600 text-white border-red-500" 
                            : "bg-red-950/30 text-red-500 border-red-900/30"
                    )}>
                        {finding.isError ? "Runtime Error" : "Scan Match"}
                    </div>
                </div>

                <div className="grid grid-cols-1 @lg:grid-cols-2 gap-4">
                    <div className={twMerge(
                        "border rounded-2xl p-4",
                        finding.isError ? "bg-red-950/10 border-red-900/20" : "bg-orange-950/10 border-orange-900/20"
                    )}>
                        <div className={twMerge(
                            "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-2",
                            finding.isError ? "text-red-500" : "text-orange-500"
                        )}>
                            {finding.isError ? <FiAlertTriangle size={12} /> : <FiShield size={12} />}
                            {finding.isError ? "The Cause" : "The Risk"}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed italic">{finding.risk}</p>
                    </div>
                    <div className={twMerge(
                        "border rounded-2xl p-4",
                        finding.isError ? "bg-red-950/10 border-red-900/20" : "bg-emerald-950/10 border-emerald-900/20"
                    )}>
                        <div className={twMerge(
                            "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-2",
                            finding.isError ? "text-red-500" : "text-emerald-500"
                        )}>
                            {finding.isError ? <FiEdit2 size={12} /> : <FiCheckCircle size={12} />}
                            {finding.isError ? "The Fix" : "Mitigation"}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed italic">{finding.solution}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export const SensitiveDataMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [internalFindings, setInternalFindings] = useState<SensitiveDataFinding[]>([]);
    const [loading, setLoading] = useState(false);
    const [trafficData, setTrafficData] = useState<{ body: string | null, headers: any } | null>(null);
    const [tab, setTab] = useState<'results' | 'checkers'>('results');

    const { customFindings, isRunning } = useCustomScripts<SensitiveDataFinding>('sensitive_data', trafficData?.body || null, trafficData?.headers || []);

    const fetchData = useCallback(async () => {
        if (!trafficId) return;
        setLoading(true);
        try {
            const res = await provider.getRequestPairData(trafficId);
            const body = decodeBody(res.body);
            setTrafficData({ body, headers: res.headers });

            const found: SensitiveDataFinding[] = [];
            const addFinding = (type: string, value: string, location: string = 'Body') => {
                const meta = LEAK_METADATA[type] || { risk: 'Unknown security risk.', solution: 'Review security best practices.' };
                found.push({ type, value, location, ...meta });
            };

            if (body) {
                if (body.match(/eyJh/)) addFinding('JWT Token', 'JWT pattern detected in payload');
                if (body.match(/api_key|apikey|x-api-key/i)) addFinding('API Key', 'Keyword "api_key" found in content');
                if (body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) addFinding('Email Address', 'Exposed PII (Email)');
                if (body.match(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/)) addFinding('Credit Card', 'Potential PAN digits found');
            }

            res.headers.forEach(h => {
                if (h.key?.toLowerCase().match(/authorization|cookie|session/)) {
                    addFinding('Auth Header', `High-entropy header: ${h.key}`, 'Headers');
                }
            });

            setInternalFindings(found);
        } finally {
            setLoading(false);
        }
    }, [trafficId, provider]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!trafficId) return <Placeholder text="Select a request to scan for leaks" />;

    return (
        <div className="bg-[#0a0a0a] h-full font-sans select-none flex flex-col overflow-hidden">
            <div className="shrink-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-zinc-900 px-8 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <div className={twMerge(
                        "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                        tab === 'results' ? "bg-orange-600/10 text-orange-500 border-orange-500/20" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                    )}>
                        <FiShield size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase italic tracking-tighter">Leak Detective</h2>
                        <div className="flex gap-4 mt-1">
                            <button
                                onClick={() => setTab('results')}
                                className={twMerge("text-[10px] font-black uppercase tracking-widest", tab === 'results' ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300")}
                            >
                                Results
                            </button>
                            <button
                                onClick={() => setTab('checkers')}
                                className={twMerge("text-[10px] font-black uppercase tracking-widest", tab === 'checkers' ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300")}
                            >
                                Custom Scripts
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-grow p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto pb-10">
                    {tab === 'results' && (
                        (loading || isRunning) && internalFindings.length === 0 ? <Placeholder text="Analyzing payload..." icon={<FiShield className="animate-pulse" />} /> :
                            (internalFindings.length === 0 && customFindings.length === 0) ? (
                                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-3xl p-12 text-center shadow-xl">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                                        <FiCheckCircle size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-emerald-400 mb-2 font-mono uppercase tracking-widest">Safe Payload Detected</h3>
                                    <p className="text-sm text-zinc-500 max-w-sm mx-auto italic leading-relaxed">
                                        No common PII (Personally Identifiable Information), raw credentials, or exposed secrets were found in the visible payload.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    {internalFindings.length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest pl-2">
                                                Core Detective Findings ({internalFindings.length})
                                            </div>
                                            {internalFindings.map((finding, i) => (
                                                <FindingCard key={`internal-${i}`} finding={finding} />
                                            ))}
                                        </div>
                                    )}

                                    {customFindings.length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest pl-2">
                                                Custom Checker Section ({customFindings.length})
                                            </div>
                                            {customFindings.map((finding, i) => (
                                                <FindingCard key={`custom-${i}`} finding={finding} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                    )}

                    {tab === 'checkers' && (
                        <CustomScriptManager category="sensitive_data" />
                    )}
                </div>
            </div>
        </div>
    );
};

const Placeholder = ({ text, icon }: { text: string, icon?: React.ReactNode }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 font-sans">
        <div className="text-center">
            <div className="text-4xl font-black mb-4 flex justify-center opacity-20">{icon || <FiShield />}</div>
            <div className="text-xs uppercase tracking-widest font-black italic">{text}</div>
        </div>
    </div>
);

export default SensitiveDataMode;
