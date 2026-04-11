import React from "react";
import { FiAlertCircle } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { ViewerBlock } from "@src/context/ViewerContext";
import { renderResult } from "../builder-utils/renderResult";

interface BlockPreviewProps {
    block: ViewerBlock;
    result?: any;
    isEditingCode: boolean;
    isMaximized: boolean;
}

export const BlockPreview = ({ block, result, isEditingCode, isMaximized }: BlockPreviewProps) => {
    return (
        <div
            className={twMerge(
                "p-0 overflow-auto max-h-[800px] transition-all", 
                isEditingCode && (block.colSpan >= 8 || isMaximized) ? "order-2 border-l border-zinc-800 bg-black/20" : "order-1"
            )}
            style={{ padding: block.padding !== undefined ? `${block.padding}px` : '0px' }}
        >
            {result?.error ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 m-4">
                    <FiAlertCircle className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <div className="text-red-400 font-bold text-xs mb-1 uppercase tracking-tight">Execution Error</div>
                        <div className="text-[11px] font-mono text-zinc-500 whitespace-pre-wrap">{result.error}</div>
                    </div>
                </div>
            ) : (
                renderResult(block, result)
            )}
        </div>
    );
};
