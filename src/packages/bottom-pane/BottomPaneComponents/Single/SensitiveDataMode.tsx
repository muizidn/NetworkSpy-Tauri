import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { FiShield, FiAlertTriangle, FiCheckCircle, FiInfo, FiExternalLink } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { decodeBody } from "../../utils/bodyUtils";

interface LeakInfo {
    type: string;
    value: string;
    location?: string;
    risk: string;
    solution: string;
}

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

export const SensitiveDataMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [leaks, setLeaks] = useState<LeakInfo[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        provider.getRequestPairData(trafficId)
            .then((res) => {
                const found: LeakInfo[] = [];
                const body = decodeBody(res.body);

                const addLeak = (type: string, value: string, location: string = 'Body') => {
                    const meta = LEAK_METADATA[type] || { risk: 'Unknown security risk.', solution: 'Review security best practices.' };
                    found.push({ type, value, location, ...meta });
                };

                if (!body) return;

                // Basic regex patterns
                if (body.match(/eyJh/)) addLeak('JWT Token', 'JWT pattern detected in payload');
                if (body.match(/api_key|apikey|x-api-key/i)) addLeak('API Key', 'Keyword "api_key" found in content');
                if (body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) addLeak('Email Address', 'Exposed PII (Email)');
                if (body.match(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/)) addLeak('Credit Card', 'Potential PAN digits found');

                res.headers.forEach(h => {
                    if (h.key?.toLowerCase().match(/authorization|cookie|session/)) {
                        addLeak('Auth Header', `High-entropy header: ${h.key}`, 'Headers');
                    }
                });

                setLeaks(found);
            })
            .finally(() => setLoading(false));
    }, [trafficId, provider]);

    if (!trafficId) return <Placeholder text="Select a request to scan for leaks" />;
    if (loading) return <Placeholder text="Analyzing payload..." icon={<FiShield className="animate-pulse" />} />;

    return (
        <div className="bg-[#0a0a0a] p-8 min-h-full font-sans select-none">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-6 mb-12 border-b border-zinc-900 pb-8">
                    <div className="w-16 h-16 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-900/10">
                        <FiAlertTriangle size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Leak Detective</h2>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                             Full Spectrum Security Scan • v2.0
                        </div>
                    </div>
                </div>

                {leaks.length === 0 ? (
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
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest pl-2">
                            Detected Issues ({leaks.length})
                        </div>
                        {leaks.map((leak, i) => (
                            <div key={i} className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40 hover:border-orange-900/50 transition-all duration-300 shadow-xl">
                                <div className="p-6 flex flex-col md:flex-row gap-6">
                                    <div className="flex-grow space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-orange-500 uppercase tracking-widest">{leak.type}</span>
                                                    <span className="px-2 py-0.5 bg-black/50 text-[9px] text-zinc-500 rounded-full border border-zinc-800 uppercase font-bold">{leak.location}</span>
                                                </div>
                                                <div className="text-sm font-mono text-zinc-300 mt-2 break-all bg-black/30 p-3 rounded-xl border border-white/5">{leak.value}</div>
                                            </div>
                                            <div className="bg-red-950/30 text-red-500 text-[10px] font-black px-3 py-1 rounded-full border border-red-900/30 uppercase tracking-tighter shadow-sm animate-pulse">
                                                Risk Detected
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="bg-orange-950/10 border border-orange-900/20 rounded-2xl p-4">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">
                                                    <FiShield size={12} /> The Risk
                                                </div>
                                                <p className="text-[11px] text-zinc-400 leading-relaxed italic">{leak.risk}</p>
                                            </div>
                                            <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-2xl p-4">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">
                                                    <FiCheckCircle size={12} /> Mitigation
                                                </div>
                                                <p className="text-[11px] text-zinc-400 leading-relaxed italic">{leak.solution}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Placeholder = ({ text, icon = null }: { text: string, icon?: React.ReactNode }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a] p-10 text-center select-none font-sans">
        <div className="flex flex-col items-center gap-6">
            <div className="text-6xl text-zinc-800 font-black opacity-30 italic animate-in fade-in zoom-in duration-500 select-none">
                {icon || <FiShield />}
            </div>
            <div className="max-w-xs mx-auto">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-2">Security Engine Standby</div>
                <div className="text-sm text-zinc-500 font-medium italic">{text}</div>
            </div>
        </div>
    </div>
);
