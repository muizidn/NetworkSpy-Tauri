import React from "react";
import { createPortal } from "react-dom";
import { FiX, FiPause, FiPlay, FiActivity } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useAppProvider } from "../app-env";

interface BreakpointHitDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BreakpointHitDialog: React.FC<BreakpointHitDialogProps> = ({ isOpen, onClose }) => {
    const { pausedIds, resumeBreakpoint } = useAppProvider();

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div 
                className="w-[500px] max-h-[80vh] bg-[#0d0d0d] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#121212] px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                            <FiPause size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white tracking-tight uppercase">
                                Paused Breakpoints
                            </h2>
                            <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">
                                {pausedIds.length} Traffic items waiting
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                    {pausedIds.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-600 gap-3">
                            <FiActivity size={32} opacity={0.3} />
                            <span className="text-[11px] font-bold uppercase tracking-widest">No active breakpoints</span>
                        </div>
                    ) : (
                        pausedIds.map((id) => {
                            const isRequest = id.endsWith("_req");
                            const realId = id.replace(/_(req|res)$/, "");
                            
                            return (
                                <div 
                                    key={id} 
                                    className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 flex flex-col gap-3 hover:bg-zinc-900/60 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={twMerge(
                                                "w-8 h-8 rounded-lg flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110",
                                                isRequest ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                            )}>
                                                <FiPause size={16} />
                                            </div>
                                            <div>
                                                <div className={twMerge(
                                                    "text-[9px] font-black tracking-[0.15em] uppercase",
                                                    isRequest ? "text-amber-500" : "text-blue-500"
                                                )}>
                                                    {isRequest ? "Request Intercepted" : "Response Intercepted"}
                                                </div>
                                                <div className="text-[11px] text-zinc-300 font-mono mt-0.5 truncate max-w-[200px]">
                                                    ID: {realId.substring(0, 16)}...
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => resumeBreakpoint(id)}
                                            className={twMerge(
                                                "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 transition-all active:scale-95 shadow-lg",
                                                isRequest 
                                                    ? "bg-amber-600 hover:bg-amber-500 text-black shadow-amber-950/20" 
                                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/20"
                                            )}
                                        >
                                            <FiPlay size={12} fill="currentColor" />
                                            Resume
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {pausedIds.length > 0 && (
                    <div className="bg-[#121212] px-6 py-4 border-t border-zinc-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">
                            Review and resume to continue traffic
                        </span>
                        <button 
                            onClick={async () => {
                                for (const id of [...pausedIds]) {
                                    await resumeBreakpoint(id);
                                }
                            }}
                            className="text-[10px] font-black text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest"
                        >
                            Resume All
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
