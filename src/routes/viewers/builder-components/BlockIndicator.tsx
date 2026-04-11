import React from "react";
import { FiMinimize, FiMaximize, FiCode, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { ViewerBlock } from "@src/context/ViewerContext";

interface BlockIndicatorProps {
    block: ViewerBlock;
    isEditingCode: boolean;
    isMaximized: boolean;
    isSmall: boolean;
    setIsMaximized: (val: boolean) => void;
    setIsEditingCode: (val: boolean) => void;
    onUpdate?: (updates: Partial<ViewerBlock>) => void;
    onDelete?: () => void;
}

export const BlockIndicator = ({
    block,
    isEditingCode,
    isMaximized,
    isSmall,
    setIsMaximized,
    setIsEditingCode,
    onUpdate,
    onDelete,
}: BlockIndicatorProps) => {
    return (
        <div className={twMerge(
            "group-hover:flex top-0 left-0 right-0 z-10 bg-blue-600 items-center justify-between transition-all shadow-lg",
            isMaximized ? "relative flex" : "hidden absolute h-8"
        )}>
            <div className={twMerge("flex items-center gap-1.5 h-full px-1")}>
                <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-all"
                    title="Focus Mode"
                >
                    {isMaximized ? <FiMinimize size={14} /> : <FiMaximize size={14} />}
                </button>

                {(isMaximized || !isSmall) && (
                    <>
                        <button
                            onClick={() => setIsEditingCode(!isEditingCode)}
                            className={twMerge(
                                "p-1.5 rounded transition-all",
                                isEditingCode
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-white/80 hover:text-white hover:bg-white/10"
                            )}
                            title="Edit Logic Script"
                        >
                            <FiCode size={14} />
                        </button>

                        <div className="flex items-center gap-2 px-2 border-l border-white/20 ml-1 h-4">
                            <span className="text-[9px] font-black text-white/60 uppercase tracking-widest leading-none">Width</span>
                            <select
                                value={block.colSpan || 12}
                                onChange={(e) => onUpdate?.({ colSpan: parseInt(e.target.value) as any })}
                                className="bg-white/10 border border-white/20 rounded px-1 py-0.5 text-[9px] font-black text-white focus:outline-none focus:border-white/40 cursor-pointer appearance-none hover:bg-white/20"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                                    <option key={n} value={n} className="bg-zinc-900 text-white">
                                        {n}/12
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-2 border-l border-white/20 h-4">
                            <span className="text-[9px] font-black text-white/60 uppercase tracking-widest leading-none">Padding</span>
                            <input
                                type="number"
                                value={block.padding ?? 24}
                                onChange={(e) => onUpdate?.({ padding: parseInt(e.target.value) })}
                                className="w-10 bg-white/10 border border-white/20 rounded px-1 py-0.5 text-[9px] font-black text-white focus:outline-none focus:border-white/40"
                            />
                        </div>

                        {block.type === 'html' && (
                            <div className="flex items-center gap-2 px-2 border-l border-white/20 ml-1 group/unsafe relative h-4">
                                <input
                                    type="checkbox"
                                    checked={block.unsafeHtml || false}
                                    onChange={(e) => onUpdate?.({ unsafeHtml: e.target.checked })}
                                    className="checkbox checkbox-xs border-white/40 focus:ring-0 checked:bg-red-500 rounded"
                                />
                                <span className="text-[9px] font-black text-white/60 uppercase tracking-widest cursor-default flex items-center gap-1 leading-none">
                                    Host Context
                                    <FiAlertCircle size={10} className="text-white/40 group-hover/unsafe:text-red-400" />
                                </span>
                                <div className="absolute top-8 left-0 w-64 p-2 bg-red-900 border border-red-700 rounded-lg text-[9px] text-red-100 hidden group-hover/unsafe:block z-50 shadow-2xl leading-relaxed normal-case font-normal tracking-normal">
                                    <span className="font-bold underline mb-1 block">SECURITY WARNING</span>
                                    Bypasses sandboxing. Only enable if you trust the rendered code. This allows the block to access application resources.
                                </div>
                            </div>
                        )}

                        <button
                            onClick={onDelete}
                            className="p-1.5 text-white/80 hover:text-red-200 hover:bg-red-500/20 rounded transition-all ml-auto"
                            title="Delete Block"
                        >
                            <FiTrash2 size={14} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
