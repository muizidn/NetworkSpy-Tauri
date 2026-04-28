import React from "react";
import { ViewerBlock } from "@src/context/ViewerContext";
import { BlockItem } from "./BlockItem";
import { MaximizedBlock } from "./MaximizedBlock";
import { FiLayers } from "react-icons/fi";

interface CanvasProps {
    blocks: ViewerBlock[];
    isViewerMode?: boolean;
    maximizedBlockId?: string | null;
    setMaximizedBlockId?: (id: string | null) => void;
    testResults?: Record<string, any>;
    updateBlock?: (id: string, updates: Partial<ViewerBlock>) => void;
    deleteBlock?: (id: string) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
    blocks,
    maximizedBlockId,
    setMaximizedBlockId,
    testResults,
    updateBlock,
    deleteBlock,
    isViewerMode
}) => {
    // If a block is maximized, show only that block in full view
    if (maximizedBlockId && setMaximizedBlockId && updateBlock) {
        const block = blocks.find(b => b.id === maximizedBlockId);
        if (block) {
            return (
                <div className="h-full w-full bg-[#111111]">
                    <MaximizedBlock
                        block={block}
                        result={testResults && testResults[maximizedBlockId]}
                        onClose={() => setMaximizedBlockId(null)}
                        onUpdate={(updates) => updateBlock(maximizedBlockId, updates)}
                    />
                </div>
            );
        }
    }

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar bg-[#080808]">
            <div id="viewerbuilder-canvas" className="grid grid-cols-12 w-full items-start">
                {blocks.length === 0 ? (
                    <div className="col-span-12 flex justify-center items-center p-20">
                        <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-20 flex flex-col items-center justify-center text-zinc-600">
                            <FiLayers size={48} className="mb-4 opacity-20" />
                            <p className="text-sm font-medium">Your canvas is empty</p>
                            <p className="text-xs mt-1">Add blocks to start building</p>
                        </div>
                    </div>
                ) : (
                    blocks.map((block) => (
                        <BlockItem
                            key={block.id}
                            block={block}
                            isViewerMode={isViewerMode}
                            result={testResults && testResults[block.id]}
                            onDelete={deleteBlock ? (() => deleteBlock(block.id)) : undefined}
                            onUpdate={updateBlock ? ((updates) => updateBlock(block.id, updates)) : undefined}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

