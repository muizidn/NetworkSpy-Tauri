import React from "react";
import { FiAlertCircle, FiZap } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { ViewerBlock } from "@src/context/ViewerContext";
import { renderResult } from "../builder-utils/renderResult";

interface BlockPreviewProps {
    block: ViewerBlock;
    result?: any;
    isEditingCode: boolean;
    isMaximized: boolean;
    onDebugWithAi?: (blockId: string, error: string) => void;
}

export const BlockPreview = ({ block, result, isEditingCode, isMaximized, onDebugWithAi }: BlockPreviewProps) => {
    return (
        <div
            className={twMerge(
                "p-0 overflow-auto max-h-[800px] transition-all", 
                isEditingCode && (block.colSpan >= 8 || isMaximized) ? "order-2 border-l border-zinc-800 bg-black/20" : "order-1"
            )}
            style={{ padding: block.padding !== undefined ? `${block.padding}px` : '0px' }}
        >
            {result?.error ? (
                <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl flex flex-col gap-4 m-4 animate-in fade-in zoom-in duration-300">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shrink-0 shadow-lg shadow-red-900/10">
                            <FiAlertCircle size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-red-400 font-bold text-[10px] mb-1 italic">Execution error</div>
                            <div className="text-[11px] font-mono text-zinc-500 whitespace-pre-wrap leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">{result.error}</div>
                        </div>
                    </div>
                    
                    {onDebugWithAi && (
                        <button
                            onClick={() => onDebugWithAi(block.id, result.error)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] border border-blue-400/20"
                        >
                            <FiZap size={14} />
                            DEBUG WITH AI
                        </button>
                    )}
                </div>
            ) : (
                renderResult(block, result)
            )}
        </div>
    );
};
