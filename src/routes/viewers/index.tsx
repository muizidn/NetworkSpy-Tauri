import React, { useState } from "react";
import { twMerge } from "tailwind-merge";

import ViewerList from "@src/routes/viewers/ViewerList";
import ViewerBuilder from "@src/routes/viewers/ViewerBuilder";
import { Viewer } from "@src/context/ViewerContext";

const ViewersPage: React.FC = () => {
    const [selectedViewer, setSelectedViewer] = useState<Viewer | null>(null);
    const [isCompact, setIsCompact] = useState(false);

    return (
        <div className="flex h-full bg-[#050505] overflow-hidden">
            <div className={twMerge(
                "border-r border-zinc-900 flex flex-col h-full bg-[#080808] transition-all duration-300",
                isCompact ? "w-16" : "w-80"
            )}>
                <ViewerList 
                    selectedViewerId={selectedViewer?.id} 
                    onSelectViewer={setSelectedViewer} 
                    isCompact={isCompact}
                    onToggleCompact={() => setIsCompact(!isCompact)}
                />
            </div>
            
            <div className="flex-1 h-full overflow-hidden">
                {selectedViewer ? (
                    <ViewerBuilder viewer={selectedViewer} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                        <div className="w-20 h-20 rounded-full bg-zinc-900/50 flex items-center justify-center border border-zinc-800/50">
                            <span className="text-4xl">👁️</span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-zinc-300 font-bold">Custom Viewer Builder</h3>
                            <p className="text-xs max-w-xs mt-2">
                                Select a viewer from the list or create a new one to start building your custom inspection UI.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewersPage;
