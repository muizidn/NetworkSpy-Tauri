import React from "react";
import { FiCheck, FiEdit2, FiLayers, FiColumns, FiSave } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";

interface BuilderHeaderProps {
    viewerName: string;
    setViewerName: (name: string) => void;
    isEditingName: boolean;
    setIsEditingName: (editing: boolean) => void;
    isToolboxVisible: boolean;
    setIsToolboxVisible: (visible: boolean) => void;
    handleSave: () => void;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
    viewerName, setViewerName, isEditingName, setIsEditingName,
    isToolboxVisible, setIsToolboxVisible, handleSave
}) => {
    return (
        <ToolBaseHeader
            title={
                <div className="flex items-center gap-2">
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus
                                value={viewerName}
                                onChange={(e) => setViewerName(e.target.value)}
                                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                            />
                            <button onClick={() => setIsEditingName(false)} className="text-green-500"><FiCheck size={16} /></button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group">
                            <span>{viewerName}</span>
                            <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-blue-400 transition-all">
                                <FiEdit2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            }
            description="Build custom UI view for network traffic"
            icon={<FiLayers size={22} />}
            actions={
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsToolboxVisible(!isToolboxVisible)}
                        className={twMerge(
                            "p-2 rounded-lg transition-all",
                            !isToolboxVisible ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-800"
                        )}
                        title="Toggle Toolbox"
                    >
                        <FiColumns size={18} />
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                    >
                        <FiSave />
                        SAVE VIEWER
                    </button>
                </div>
            }
        />
    );
};
