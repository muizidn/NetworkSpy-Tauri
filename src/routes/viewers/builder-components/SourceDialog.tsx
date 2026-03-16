import React from "react";
import { FiX, FiSearch, FiAlertCircle, FiCheck } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

interface SourceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    testSource: 'live' | 'session';
    setTestSource: (source: 'live' | 'session') => void;
    selectedSessionId: string;
    setSelectedSessionId: (id: string) => void;
    selectedTrafficId: string;
    setSelectedTrafficId: (id: string) => void;
    filter: string;
    setFilter: (filter: string) => void;
    filteredTraffic: any[];
    sessions: any[];
}

export const SourceDialog: React.FC<SourceDialogProps> = ({
    isOpen, onClose, testSource, setTestSource,
    selectedSessionId, setSelectedSessionId,
    selectedTrafficId, setSelectedTrafficId,
    filter, setFilter,
    filteredTraffic, sessions
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-zinc-900 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Set Preview Context</h2>
                        <p className="text-xs text-zinc-500 mt-1">Select the traffic data you want to use for viewer testing</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-xl transition-colors">
                        <FiX size={20} className="text-zinc-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest pl-1">Source Type</label>
                            <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                                <button
                                    onClick={() => { setTestSource('live'); setSelectedTrafficId(""); }}
                                    className={twMerge(
                                        "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                                        testSource === 'live' ? "bg-zinc-800 text-white shadow-xl shadow-black/50" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Live Stream
                                </button>
                                <button
                                    onClick={() => { setTestSource('session'); setSelectedTrafficId(""); }}
                                    className={twMerge(
                                        "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                                        testSource === 'session' ? "bg-zinc-800 text-white shadow-xl shadow-black/50" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Saved Session
                                </button>
                            </div>
                        </div>

                        {testSource === 'session' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest pl-1">Target Session</label>
                                <select
                                    value={selectedSessionId}
                                    onChange={(e) => { setSelectedSessionId(e.target.value); setSelectedTrafficId(""); }}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50 appearance-none"
                                >
                                    <option value="">-- Choose Session --</option>
                                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input
                                placeholder="Filter traffic items by method, URI, or ID..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-11 pr-4 py-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar border border-zinc-900 rounded-2xl bg-black/40">
                            {filteredTraffic.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-zinc-700">
                                    <FiAlertCircle size={32} className="mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No matches found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-900">
                                    {filteredTraffic.map((t: any) => (
                                        <button
                                            key={t.id}
                                            onClick={() => { setSelectedTrafficId(t.id); onClose(); }}
                                            className={twMerge(
                                                "w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-all",
                                                selectedTrafficId === t.id ? "bg-blue-600/5" : ""
                                            )}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <span className={twMerge(
                                                    "w-12 h-6 flex items-center justify-center rounded text-[10px] font-black uppercase shrink-0",
                                                    t.method === 'GET' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                                                        t.method === 'POST' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                                            "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                                                )}>
                                                    {t.method}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-zinc-200 truncate font-mono">{t.uri || t.url}</div>
                                                    <div className="text-[10px] text-zinc-600 mt-0.5 truncate uppercase tracking-widest font-black">ID: {t.id}</div>
                                                </div>
                                            </div>
                                            {selectedTrafficId === t.id && (
                                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
                                                    <FiCheck size={14} className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-zinc-900 bg-zinc-900/20 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                        {filteredTraffic.length} Items Available
                    </span>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
                    >
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
};
