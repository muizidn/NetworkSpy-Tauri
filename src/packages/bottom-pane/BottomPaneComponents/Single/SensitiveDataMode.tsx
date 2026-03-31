import { useAppProvider } from "@src/packages/app-env";
import { CustomChecker } from "@src/packages/app-env/AppProvider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiCode, FiEdit2, FiInfo, FiPlus, FiSave, FiShield, FiTrash2, FiX, FiAlertTriangle } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { decodeBody } from "../../utils/bodyUtils";
import SensitiveDataWorker from './Workers/SensitiveDataWorker?worker';

interface LeakInfo {
    type: string;
    value: string;
    location?: string;
    risk: string;
    solution: string;
    isCustom?: boolean;
    isError?: boolean;
    scriptName?: string;
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

const LeakCard = ({ leak }: { leak: LeakInfo }) => (
    <div className={twMerge(
        "group overflow-hidden rounded-3xl border transition-all duration-300 shadow-xl",
        leak.isError 
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
                                leak.isError ? "text-red-500" : "text-orange-500"
                            )}>
                                {leak.type}
                            </span>
                            <span className="px-2 py-0.5 bg-black/50 text-[9px] text-zinc-500 rounded-full border border-zinc-800 uppercase font-bold">{leak.location}</span>
                            {leak.isCustom && <span className="px-2 py-0.5 bg-blue-950/30 text-[9px] text-blue-500 rounded-full border border-blue-900/30 uppercase font-black tracking-tighter">Custom</span>}
                        </div>
                        <div className={twMerge(
                            "text-sm font-mono mt-2 break-all p-3 rounded-xl border",
                            leak.isError 
                                ? "text-red-400 bg-red-950/20 border-red-500/20" 
                                : "text-zinc-300 bg-black/30 border-white/5"
                        )}>
                            {leak.value}
                        </div>
                    </div>
                    <div className={twMerge(
                        "text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-tighter shadow-sm animate-pulse",
                        leak.isError 
                            ? "bg-red-600 text-white border-red-500" 
                            : "bg-red-950/30 text-red-500 border-red-900/30"
                    )}>
                        {leak.isError ? "Runtime Error" : "Risk Detected"}
                    </div>
                </div>

                <div className="grid grid-cols-1 @lg:grid-cols-2 gap-4">
                    <div className={twMerge(
                        "border rounded-2xl p-4",
                        leak.isError ? "bg-red-950/10 border-red-900/20" : "bg-orange-950/10 border-orange-900/20"
                    )}>
                        <div className={twMerge(
                            "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-2",
                            leak.isError ? "text-red-500" : "text-orange-500"
                        )}>
                            {leak.isError ? <FiAlertTriangle size={12} /> : <FiShield size={12} />}
                            {leak.isError ? "The Cause" : "The Risk"}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed italic">{leak.risk}</p>
                    </div>
                    <div className={twMerge(
                        "border rounded-2xl p-4",
                        leak.isError ? "bg-red-950/10 border-red-900/20" : "bg-emerald-950/10 border-emerald-900/20"
                    )}>
                        <div className={twMerge(
                            "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-2",
                            leak.isError ? "text-red-500" : "text-emerald-500"
                        )}>
                            {leak.isError ? <FiEdit2 size={12} /> : <FiCheckCircle size={12} />}
                            {leak.isError ? "The Fix" : "Mitigation"}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed italic">{leak.solution}</p>
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
    const [leaks, setLeaks] = useState<LeakInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'results' | 'checkers' | 'add'>('results');
    const [checkers, setCheckers] = useState<CustomChecker[]>([]);
    const [editChecker, setEditChecker] = useState<Partial<CustomChecker> | null>(null);

    useEffect(() => {
        provider.getCustomCheckers().then(setCheckers);
    }, [provider]);

    const runCustomCheckers = useCallback(async (body: string | null, headers: any): Promise<LeakInfo[]> => {
        if (!checkers.length) return [];
        const enabledCheckers = checkers.filter(c => c.enabled);
        if (!enabledCheckers.length) return [];

        const runOne = (checker: CustomChecker): Promise<LeakInfo[]> => {
            return new Promise((resolve) => {
                const worker = new SensitiveDataWorker();
                const timeout = setTimeout(() => {
                    worker.terminate();
                    resolve([{ type: 'Timeout', value: `Checker "${checker.name}" timed out`, risk: 'None', solution: 'Optimize your script' }]);
                }, 3000);

                worker.onmessage = (e) => {
                    clearTimeout(timeout);
                    worker.terminate();
                    resolve((e.data.results || []).map((r: any) => ({
                        ...r,
                        type: r.type || checker.name,
                        location: r.location || 'Custom',
                        isCustom: true
                    })));
                };
                worker.postMessage({ script: checker.script, body: body || '', headers, name: checker.name });
            });
        };

        const findings = await Promise.all(enabledCheckers.map(runOne));
        return findings.flat();
    }, [checkers]);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        provider.getRequestPairData(trafficId)
            .then(async (res) => {
                const found: LeakInfo[] = [];
                const body = decodeBody(res.body);

                const addLeak = (type: string, value: string, location: string = 'Body') => {
                    const meta = LEAK_METADATA[type] || { risk: 'Unknown security risk.', solution: 'Review security best practices.' };
                    found.push({ type, value, location, ...meta });
                };

                if (body) {
                    if (body.match(/eyJh/)) addLeak('JWT Token', 'JWT pattern detected in payload');
                    if (body.match(/api_key|apikey|x-api-key/i)) addLeak('API Key', 'Keyword "api_key" found in content');
                    if (body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) addLeak('Email Address', 'Exposed PII (Email)');
                    if (body.match(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/)) addLeak('Credit Card', 'Potential PAN digits found');
                }

                res.headers.forEach(h => {
                    if (h.key?.toLowerCase().match(/authorization|cookie|session/)) {
                        addLeak('Auth Header', `High-entropy header: ${h.key}`, 'Headers');
                    }
                });

                const customFindings = await runCustomCheckers(body, res.headers);
                found.push(...customFindings);

                setLeaks(found);
            })
            .finally(() => setLoading(false));
    }, [trafficId, provider, runCustomCheckers]);

    const handleSaveChecker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editChecker?.name || !editChecker?.script) return;

        const saved = await provider.saveCustomChecker({
            ...editChecker,
            enabled: editChecker.enabled ?? true
        });
        setCheckers(prev => {
            const index = prev.findIndex(c => c.id === saved.id);
            if (index >= 0) {
                const copy = [...prev];
                copy[index] = saved;
                return copy;
            }
            return [saved, ...prev];
        });
        setEditChecker(null);
        setTab('checkers');
    };

    const handleDeleteChecker = async (id: string) => {
        await provider.deleteCustomChecker(id);
        setCheckers(prev => prev.filter(c => c.id !== id));
    };

    const internalLeaks = leaks.filter(l => !l.isCustom);
    const customLeaks = leaks.filter(l => l.isCustom);

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
                {tab === 'checkers' && (
                    <button
                        onClick={() => { setEditChecker({ name: '', description: '', script: '', enabled: true }); setTab('add'); }}
                        className="bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black px-4 py-2 rounded-lg flex items-center gap-2 uppercase tracking-widest transition-all"
                    >
                        <FiPlus /> New Script
                    </button>
                )}
            </div>

            <div className="flex-grow p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto pb-10">
                    {tab === 'results' && (
                        loading ? <Placeholder text="Analyzing payload..." icon={<FiShield className="animate-pulse" />} /> :
                            leaks.length === 0 ? (
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
                                    {internalLeaks.length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest pl-2">
                                                Core Detective Findings ({internalLeaks.length})
                                            </div>
                                            {internalLeaks.map((leak, i) => (
                                                <LeakCard key={i} leak={leak} />
                                            ))}
                                        </div>
                                    )}

                                    {customLeaks.length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest pl-2">
                                                Custom Checker Section ({customLeaks.length})
                                            </div>
                                            {customLeaks.map((leak, i) => (
                                                <LeakCard key={i} leak={leak} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                    )}

                    {(tab === 'checkers' || tab === 'add') && (
                        <div className="space-y-6">
                            {tab === 'add' && (
                                <form onSubmit={handleSaveChecker} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-orange-600/20 text-orange-500 rounded-lg flex items-center justify-center">
                                                <FiCode size={18} />
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">{editChecker?.id ? 'Edit Custom Script' : 'Create New Script'}</h3>
                                        </div>
                                        <button type="button" onClick={() => { setTab('checkers'); setEditChecker(null); }} className="text-zinc-500 hover:text-white transition-colors">
                                            <FiX size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Checker Name</label>
                                            <input
                                                type="text"
                                                value={editChecker?.name || ''}
                                                onChange={e => setEditChecker(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="e.g. My Secret Scanner"
                                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-600 transition-colors"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Description</label>
                                            <input
                                                type="text"
                                                value={editChecker?.description || ''}
                                                onChange={e => setEditChecker(prev => ({ ...prev, description: e.target.value }))}
                                                placeholder="Detects internal project code names in traffic..."
                                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-600 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">JavaScript Logic</label>
                                            <div className="relative group">
                                                <textarea
                                                    value={editChecker?.script || ''}
                                                    onChange={e => setEditChecker(prev => ({ ...prev, script: e.target.value }))}
                                                    placeholder={`/* Example: Scanning for patterns */
const findings = [];

if (body.includes('sk_test_')) {
    findings.push({ 
        type: 'Test Key Exposure', 
        value: 'Stripe test key found in payload', 
        risk: 'Medium', 
        solution: 'Rotate the key immediately' 
    });
}

return findings;`}
                                                    className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-4 text-xs font-mono text-emerald-400 h-64 focus:outline-none focus:border-orange-600 transition-all resize-none leading-relaxed"
                                                    required
                                                />
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                                        Worker Mode
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-2 bg-blue-950/10 border border-blue-900/20 rounded-xl p-3 flex items-start gap-3">
                                                <FiInfo size={14} className="text-blue-500 mt-0.5" />
                                                <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                                                    Script should <strong className="text-white">return</strong> an array of finding objects: <code className="text-blue-400 bg-black/40 px-1 rounded">{"{ type, value, risk, solution }"}</code>. Available variables: <code className="text-blue-400 bg-black/40 px-1 rounded">body</code> (string), <code className="text-blue-400 bg-black/40 px-1 rounded">headers</code> (array).
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            className="flex-grow bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black px-6 py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all"
                                        >
                                            <FiSave /> Save Script
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setTab('checkers'); setEditChecker(null); }}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {tab === 'checkers' && (
                                <div className="space-y-4">
                                    {checkers.length === 0 ? (
                                        <div className="bg-zinc-900/20 border border-zinc-800 border-dashed rounded-3xl p-12 text-center">
                                            <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center text-zinc-500 mx-auto mb-4">
                                                <FiCode size={20} />
                                            </div>
                                            <h3 className="text-sm font-bold text-zinc-400 mb-1 uppercase tracking-widest">No Custom Scripts</h3>
                                            <p className="text-xs text-zinc-600 italic">Add your own logic to scan for project-specific secrets or leaks.</p>
                                        </div>
                                    ) : (
                                        checkers.map(checker => (
                                            <div key={checker.id} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all group shadow-lg">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-grow">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">{checker.name}</h3>
                                                            <button
                                                                onClick={async () => {
                                                                    const updated = await provider.saveCustomChecker({ ...checker, enabled: !checker.enabled });
                                                                    setCheckers(prev => prev.map(c => c.id === checker.id ? updated : c));
                                                                }}
                                                                className={twMerge(
                                                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border transition-colors",
                                                                    checker.enabled ? "bg-emerald-600/10 text-emerald-500 border-emerald-500/20" : "bg-red-600/10 text-red-500 border-red-500/20"
                                                                )}
                                                            >
                                                                {checker.enabled ? 'Active' : 'Disabled'}
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed italic">{checker.description || 'No description provided.'}</p>
                                                        <div className="mt-4 bg-black/40 rounded-xl p-3 border border-white/5 font-mono text-[9px] text-emerald-500/60 transition-all group-hover:text-emerald-500/90 overflow-hidden line-clamp-3">
                                                            {checker.script}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={() => { setEditChecker(checker); setTab('add'); }}
                                                            className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white flex items-center justify-center transition-all"
                                                        >
                                                            <FiEdit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteChecker(checker.id)}
                                                            className="w-8 h-8 rounded-lg bg-red-900/10 text-red-900 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all"
                                                        >
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Placeholder = ({ text, icon = null }: { text: string, icon?: React.ReactNode }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a] p-6 @sm:p-10 text-center select-none font-sans">
        <div className="flex flex-col items-center gap-4 @sm:p-6">
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
