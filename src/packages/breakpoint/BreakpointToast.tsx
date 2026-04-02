import React, { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { FiPlay, FiPause, FiGlobe, FiArrowRight } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

export const BreakpointToast = () => {
    const [pausedIds, setPausedIds] = useState<string[]>([]);
    const [isBreakpointEnabled, setIsBreakpointEnabled] = useState(false);

    useEffect(() => {
        // Initial state
        invoke("get_breakpoint_enabled").then(enabled => setIsBreakpointEnabled(enabled as boolean));

        const unlistenHit = listen<string>("breakpoint_hit", (event) => {
            console.log("Breakpoint hit:", event.payload);
            setPausedIds(prev => [...prev, event.payload]);
        });

        return () => {
            unlistenHit.then(f => f());
        };
    }, []);

    const resume = async (id: string) => {
        try {
            await invoke("resume_breakpoint", { trafficId: id });
            setPausedIds(prev => prev.filter(p => p !== id));
        } catch (e) {
            console.error("Failed to resume breakpoint:", e);
        }
    };

    const toggleGlobalBreakpoint = async () => {
        const next = !isBreakpointEnabled;
        await invoke("set_breakpoint_enabled", { enabled: next });
        setIsBreakpointEnabled(next);
    };

    return (
        <>
            {/* Hit Breakpoints Toasts */}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-[320px]">
                {pausedIds.map(id => {
                    const isRequest = id.endsWith("_req");
                    const realId = id.replace(/_(req|res)$/, "");
                    
                    return (
                        <div key={id} className="bg-[#121212]/95 backdrop-blur-xl border border-blue-500/30 rounded-xl shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] p-3.5 flex flex-col gap-3 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={twMerge(
                                        "w-9 h-9 rounded-lg flex items-center justify-center border shadow-inner",
                                        isRequest ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                    )}>
                                        <FiPause size={18} />
                                    </div>
                                    <div>
                                        <div className={twMerge(
                                            "text-[10px] font-black tracking-[0.2em] uppercase",
                                            isRequest ? "text-amber-500" : "text-blue-500"
                                        )}>
                                            {isRequest ? "Request Breakpoint" : "Response Breakpoint"}
                                        </div>
                                        <div className="text-[11px] text-zinc-300 font-medium mt-0.5 flex items-center gap-1.5 capitalize">
                                            {isRequest ? "Outgoing to Server" : "Incoming to Client"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => resume(id)}
                                    className={twMerge(
                                        "flex-1 h-9 rounded-lg text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
                                        isRequest 
                                            ? "bg-amber-600 hover:bg-amber-500 text-black shadow-amber-900/20" 
                                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20"
                                    )}
                                >
                                    <FiPlay size={14} fill="currentColor" />
                                    Resume {isRequest ? "Request" : "Response"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};
