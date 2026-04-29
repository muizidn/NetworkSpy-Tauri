import React, { useState } from "react";
import { FiCpu, FiChevronDown, FiChevronRight, FiCheck } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { ChatMessage } from "./types";

interface TechnicalMessageProps {
    msg: ChatMessage;
    getToolIcon: (name: string) => React.ReactNode;
}

export const TechnicalMessage: React.FC<TechnicalMessageProps> = ({ msg, getToolIcon }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const title = msg.role === 'tool' 
        ? msg.name 
        : msg.tool_calls 
            ? msg.tool_calls[0].function.name + (msg.tool_calls.length > 1 ? ` (+${msg.tool_calls.length - 1})` : '')
            : "System Dispatch";

    return (
        <div className="flex flex-col mr-auto items-start max-w-[95%] w-full animate-in fade-in slide-in-from-left-2 duration-300">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={twMerge(
                    "flex items-center gap-2 mb-1.5 transition-all cursor-pointer group px-2 py-1 rounded-md border",
                    isCollapsed 
                        ? "opacity-40 hover:opacity-100 border-transparent" 
                        : "opacity-100 bg-zinc-900/50 border-zinc-800"
                )}
            >
                <div className={twMerge(
                    "w-3 h-3 rounded-sm flex items-center justify-center",
                    msg.role === 'tool' ? "bg-emerald-500/20 text-emerald-500" : "bg-blue-500/20 text-blue-500"
                )}>
                    <FiCpu size={8} />
                </div>
                <span className="text-[9px] font-bold whitespace-nowrap">{title}</span>
                {msg.duration !== undefined && (
                    <span className="text-[7px] font-mono text-zinc-600 bg-black/20 px-1 rounded">{msg.duration}ms</span>
                )}
                <div className="ml-auto flex items-center gap-1">
                    {isCollapsed ? <FiChevronRight size={10} className="text-zinc-600" /> : <FiChevronDown size={10} className="text-zinc-600" />}
                </div>
            </button>

            {!isCollapsed && (
                <div className="w-full bg-[#0d0d0f] border border-zinc-800/50 rounded-xl overflow-hidden font-mono text-[9px] shadow-sm">
                    {msg.tool_calls?.map((tc, idx) => (
                        <div key={idx} className="px-4 py-2.5 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/30">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-zinc-400">
                                    {getToolIcon(tc.function.name)}
                                </div>
                                <div>
                                    <div className="text-zinc-500 text-[8px] leading-none mb-1 font-bold">Executing tool</div>
                                    <div className="text-white font-bold">{tc.function.name}</div>
                                </div>
                            </div>
                            <div className="text-zinc-600">[{tc.id.substring(0, 8)}]</div>
                        </div>
                    ))}
                    {msg.role === 'tool' && (
                        <div className="px-4 py-3 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-emerald-500/80">
                                <FiCheck size={10} />
                                <span className="text-[8px] font-bold">Execution result</span>
                                <span className="text-zinc-700 ml-auto text-[7px] font-bold">{msg.tool_call_id?.substring(0, 8)}</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                <pre className="text-zinc-500 leading-relaxed whitespace-pre-wrap break-all pr-2">
                                    {msg.content}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
