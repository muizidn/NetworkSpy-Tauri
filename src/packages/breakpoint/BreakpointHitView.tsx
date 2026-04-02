import React from "react";
import { FiPause, FiPlay, FiActivity } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useAppProvider } from "../app-env";

export const BreakpointHitView: React.FC = () => {
    const { pausedIds, resumeBreakpoint } = useAppProvider();

    return (
        <div className="w-full h-screen bg-[#050505] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-[#0d0d0d] px-8 py-6 border-b border-zinc-800 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                        <FiPause size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-white tracking-tight uppercase">
                            Breakpoint Interceptor
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
                                {pausedIds.length} Traffic items paused
                            </p>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={async () => {
                        for (const id of [...pausedIds]) {
                            await resumeBreakpoint(id);
                        }
                    }}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                >
                    Resume All Traffic
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4 custom-scrollbar bg-[#050505]">
                {pausedIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-4 opacity-50">
                        <FiActivity size={48} />
                        <div className="text-center">
                            <span className="text-[12px] font-black uppercase tracking-[0.2em] block">No active breakpoints</span>
                            <p className="text-[10px] font-medium mt-1">Waiting for incoming matching traffic...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pausedIds.map((id) => {
                            const isRequest = id.endsWith("_req");
                            const realId = id.replace(/_(req|res)$/, "");
                            
                            return (
                                <div 
                                    key={id} 
                                    className="bg-[#0d0d0d] border border-zinc-800/50 rounded-2xl p-5 flex flex-col gap-4 hover:border-zinc-700 transition-all group shadow-sm hover:shadow-xl"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className={twMerge(
                                            "px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase",
                                            isRequest ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                        )}>
                                            {isRequest ? "Request" : "Response"}
                                        </div>
                                        <span className="text-[10px] font-mono text-zinc-600">#{id.split('_').pop()}</span>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Traffic Identifier</label>
                                        <div className="text-[12px] text-zinc-300 font-mono bg-black/40 p-2 rounded-lg border border-zinc-800/50 truncate">
                                            {realId}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2 pt-4 border-t border-zinc-800/50">
                                        <button 
                                            onClick={() => resumeBreakpoint(id)}
                                            className={twMerge(
                                                "w-full py-3 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md",
                                                isRequest 
                                                    ? "bg-amber-600 hover:bg-amber-500 text-black shadow-amber-900/20" 
                                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20"
                                            )}
                                        >
                                            <FiPlay size={14} fill="currentColor" />
                                            Resume Execution
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
