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
    blocks, maximizedBlockId, setMaximizedBlockId,
    testResults, updateBlock, deleteBlock,
    isViewerMode
}) => {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#080808]">
            {isViewerMode && maximizedBlockId && setMaximizedBlockId && updateBlock && testResults ? (
                <MaximizedBlock
                    block={blocks.find(b => b.id === maximizedBlockId)!}
                    result={testResults[maximizedBlockId]}
                    onClose={() => setMaximizedBlockId(null)}
                    onUpdate={(updates) => updateBlock(maximizedBlockId, updates)}
                />
            ) : (
                <div className="grid grid-cols-12">
                    {blocks.length === 0 ? (
                        <div className="col-span-12 flex justify-center items-center p-20">
                            <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-20 flex flex-col items-center justify-center text-zinc-600">
                                <FiLayers size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-medium">Your canvas is empty</p>
                                <p className="text-xs mt-1">Add blocks from the right panel to start building</p>
                            </div>
                        </div>
                    ) : (
                        blocks.map((block) => (
                            <BlockItem
                                key={block.id}
                                block={block}
                                isViewerMode={isViewerMode}
                                result={testResults && testResults[block.id]}
                                onDelete={deleteBlock && (() => deleteBlock(block.id))}
                                onUpdate={updateBlock && ((updates) => updateBlock(block.id, updates))}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
