import React, { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { ViewerBlock } from "@src/context/ViewerContext";
import { createPortal } from "react-dom";
import { BlockIndicator } from "./BlockIndicator";
import { BlockPreview } from "./BlockPreview";
import { BlockEditorView } from "./BlockEditorView";

interface BlockItemProps {
    block: ViewerBlock;
    result?: any;
    isViewerMode?: boolean;
    onDelete?: () => void;
    onUpdate?: (updates: Partial<ViewerBlock>) => void;
    onDebugWithAi?: (blockId: string, error: string) => void;
}

export const BlockItem = ({ block, result, onDelete, onUpdate, isViewerMode = false, onDebugWithAi }: BlockItemProps) => {
    const [isEditingCode, setIsEditingCode] = useState(false);
    const [activeTab, setActiveTab] = useState<'js' | 'html' | 'css' | 'output'>('js');
    const [isMaximized, setIsMaximized] = useState(false);

    const isSmall = useMemo(() => {
        return block.colSpan < 4;
    }, [block.colSpan]);

    const isSideBySide = isEditingCode && (block.colSpan >= 8 || isMaximized);

    const component = (
        <div className={twMerge(
            `relative group bg-zinc-900/40 overflow-hidden transition-all shadow-xl ${["col-span-1", "col-span-2", "col-span-3", "col-span-4", "col-span-5", "col-span-6", "col-span-7", "col-span-8", "col-span-9", "col-span-10", "col-span-11", "col-span-12"][(block.colSpan || 12) - 1]}`,
            isViewerMode ? "" : `border border-zinc-800 hover:border-blue-500`
        )}>
            {/* CONTROL BAR */}
            {!isViewerMode && (
                <BlockIndicator
                    block={block}
                    isEditingCode={isEditingCode}
                    isMaximized={isMaximized}
                    isSmall={isSmall}
                    setIsMaximized={setIsMaximized}
                    setIsEditingCode={setIsEditingCode}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                />
            )}

            <div className={twMerge("p-0 transition-all", isSideBySide ? "grid grid-cols-2" : "flex flex-col")}>
                <BlockPreview
                    block={block}
                    result={result}
                    isEditingCode={isEditingCode}
                    isMaximized={isMaximized}
                    onDebugWithAi={onDebugWithAi}
                />

                {!isViewerMode && isEditingCode && (
                    <BlockEditorView
                        block={block}
                        result={result}
                        isMaximized={isMaximized}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        onUpdate={onUpdate}
                    />
                )}
            </div>
        </div>
    );

    if (isMaximized) {
        return createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-[#111111] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-[90%] overflow-hidden animate-in fade-in zoom-in duration-200 p-4"
                    onClick={(e) => e.stopPropagation()}>
                    {component}
                </div>
            </div>,
            document.body
        );
    }

    return component;
};