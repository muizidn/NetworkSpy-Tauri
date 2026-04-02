import React from "react";
import { FiPause, FiPlay, FiActivity } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useAppProvider } from "../app-env";

export const BreakpointHitView: React.FC = () => {
    const { pausedBreakpoints, resumeBreakpoint } = useAppProvider();
    const [resumingIds, setResumingIds] = React.useState<Set<string>>(new Set());

    const handleResume = async (id: string) => {
        setResumingIds(prev => new Set(prev).add(id));
        try {
            await resumeBreakpoint(id);
        } finally {
            setResumingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleResumeAll = async () => {
        const ids = pausedBreakpoints.map(b => b.id);
        ids.forEach(id => setResumingIds(prev => new Set(prev).add(id)));
        try {
            for (const id of ids) {
                await resumeBreakpoint(id);
            }
        } finally {
            setResumingIds(new Set());
        }
    };

    const isAnyResuming = resumingIds.size > 0;

    return (
        <div className="w-full h-screen bg-[#050505] flex flex-col overflow-hidden text-zinc-100">
            {/* Header */}
            <div className="bg-[#0d0d0d] px-8 py-6 border-b border-zinc-800 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                        {isAnyResuming ? (
                             <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                        ) : (
                            <FiPause size={20} />
                        )}
                    </div>
                    <div>
                        <h2 className="text-base font-black text-white tracking-tight uppercase">
                            Breakpoint Interceptor
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className={twMerge("w-1.5 h-1.5 rounded-full bg-amber-500", !isAnyResuming && "animate-pulse")} />
                            <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
                                {pausedBreakpoints.length} Traffic items paused
                            </p>
                        </div>
                    </div>
                </div>
                
                {pausedBreakpoints.length > 0 && (
                    <button 
                        disabled={isAnyResuming}
                        onClick={handleResumeAll}
                        className={twMerge(
                            "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center gap-2",
                            isAnyResuming 
                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                        )}
                    >
                        {isAnyResuming && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                        {isAnyResuming ? "Resuming All..." : "Resume All Traffic"}
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4 custom-scrollbar bg-[#050505]">
                {pausedBreakpoints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-4 opacity-50 text-center">
                        <FiActivity size={48} />
                        <div>
                            <span className="text-[12px] font-black uppercase tracking-[0.2em] block">No active breakpoints</span>
                            <p className="text-[10px] font-medium mt-1">Waiting for incoming matching traffic...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pausedBreakpoints.map((hit) => {
                            const { id, name } = hit;
                            const isRequest = id.endsWith("_req");
                            const realId = id.replace(/_(req|res)$/, "");
                            const isThisResuming = resumingIds.has(id);
                            
                            return (
                                <div 
                                    key={id} 
                                    className={twMerge(
                                        "bg-[#0d0d0d] border rounded-2xl p-5 flex flex-col gap-4 transition-all group shadow-sm",
                                        isThisResuming ? "border-blue-500/50 bg-blue-500/5 opacity-70" : "border-zinc-800/50 hover:border-zinc-700 hover:shadow-xl"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className={twMerge(
                                            "px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase",
                                            isRequest ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                        )}>
                                            {isRequest ? "Request" : "Response"}
                                        </div>
                                        {isThisResuming ? (
                                            <div className="w-3 h-3 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
                                        ) : (
                                            <span className="text-[10px] font-mono text-zinc-600">#{id.split('_').pop()?.split('-').pop()}</span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Matched Rule</label>
                                            <div className="text-[13px] text-amber-400 font-bold tracking-tight bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 mt-1">
                                                {name || "Unnamed Rule"}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest pl-1">Traffic Identifier</label>
                                            <div className="text-[11px] text-zinc-400 font-mono bg-black/40 p-2.5 rounded-xl border border-zinc-800/50 truncate shadow-inner mt-1">
                                                {realId}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-1 pt-4 border-t border-zinc-800/50">
                                        <button 
                                            disabled={isThisResuming}
                                            onClick={() => handleResume(id)}
                                            className={twMerge(
                                                "w-full py-3 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md",
                                                isThisResuming 
                                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                                                    : isRequest 
                                                        ? "bg-amber-600 hover:bg-amber-500 text-black shadow-amber-900/20" 
                                                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20"
                                            )}
                                        >
                                            {isThisResuming ? (
                                                <div className="w-3 h-3 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                                            ) : (
                                                <FiPlay size={14} fill="currentColor" />
                                            )}
                                            {isThisResuming ? "Processing..." : "Resume Execution"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-[#0d0d0d] px-8 py-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Status:</span>
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Listening for events
                    </span>
                </div>
                <p className="text-[10px] text-zinc-600 font-medium italic">
                    NetworkSpy Breakpoint Control v1.0
                </p>
            </div>
        </div>
    );
};
