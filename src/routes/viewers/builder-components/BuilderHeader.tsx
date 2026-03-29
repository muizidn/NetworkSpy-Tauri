import React from "react";
import { FiCheck, FiEdit2, FiLayers, FiColumns, FiSave, FiCode, FiEye } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { ToolBaseHeader } from "@src/packages/ui/ToolBaseHeader";
import { ViewerBlock } from "@src/context/ViewerContext";

interface BuilderHeaderProps {
    viewerName: string;
    setViewerName: (name: string) => void;
    isEditingName: boolean;
    setIsEditingName: (editing: boolean) => void;
    isToolboxVisible: boolean;
    setIsToolboxVisible: (visible: boolean) => void;
    handleSave: () => void;
    blocks: ViewerBlock[];
    testResults: Record<string, any>;
    viewMode: 'preview' | 'source';
    setViewMode: (mode: 'preview' | 'source') => void;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
    viewerName, setViewerName, isEditingName, setIsEditingName,
    isToolboxVisible, setIsToolboxVisible, handleSave,
    viewMode, setViewMode
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
                        <div className="flex items-center gap-2 group border-b border-transparent hover:border-zinc-800 transition-all pb-0.5">
                            <span className="text-sm font-black text-white italic tracking-tighter uppercase">{viewerName}</span>
                            <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-blue-400 transition-all">
                                <FiEdit2 size={12} />
                            </button>
                        </div>
                    )}
                </div>
            }
            description="Build custom UI view for network traffic"
            icon={<FiLayers size={20} className="text-blue-500" />}
            actions={
                <div className="flex items-center gap-3">
                    {/* View Mode Switcher */}
                    <div className="flex items-center bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 shadow-inner mr-2">
                        <button
                            onClick={() => setViewMode('preview')}
                            className={twMerge(
                                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                viewMode === 'preview' 
                                    ? "bg-zinc-800 text-white shadow-lg" 
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <FiEye size={14} />
                            PREVIEW
                        </button>
                        <button
                            onClick={() => setViewMode('source')}
                            className={twMerge(
                                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                viewMode === 'source' 
                                    ? "bg-zinc-800 text-amber-500 shadow-lg" 
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <FiCode size={14} />
                            SOURCE
                        </button>
                    </div>

                    <div className="h-6 w-[1px] bg-zinc-800 mx-1"></div>

                    <button
                        onClick={() => setIsToolboxVisible(!isToolboxVisible)}
                        className={twMerge(
                            "p-2.5 rounded-xl transition-all border border-transparent shadow-md active:scale-95",
                            !isToolboxVisible ? "bg-blue-600 text-white shadow-blue-900/20" : "bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 shadow-black/40"
                        )}
                        title="Toggle Toolbox"
                    >
                        <FiColumns size={18} />
                    </button>
                    
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 border border-blue-400/20"
                    >
                        <FiSave size={14} />
                        SAVE
                    </button>
                </div>
            }
        />
    );
};
