import React from "react";
import { FiGlobe, FiCheckCircle } from "react-icons/fi";
import { BreakpointData } from "@src/packages/app-env/AppProvider";

interface EditorHeaderProps {
    selectedHitId: string;
    selectedData: BreakpointData;
    resumingIds: Set<string>;
    handleResume: (withModifications: boolean) => void;
}

export const BreakpointEditorHeader: React.FC<EditorHeaderProps> = ({
    selectedHitId,
    selectedData,
    resumingIds,
    handleResume
}) => {
    return (
        <div className="h-20 bg-[#0d0d0d] border-b border-zinc-800 px-8 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-sm font-black text-white uppercase tracking-tight">Review Interception</h1>
                        <div className="text-[9px] text-zinc-500 font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                            {selectedHitId}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 opacity-70">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase">
                            <FiGlobe size={12} className="text-zinc-600" />
                            <span className="truncate max-w-[300px]">{selectedData.uri || "N/A"}</span>
                        </div>
                        {selectedData.status_code && (
                            <div className="text-[10px] text-emerald-400 font-black px-1.5 bg-emerald-500/10 rounded">
                                {selectedData.status_code}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => handleResume(false)}
                    disabled={resumingIds.has(selectedHitId)}
                    className="px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 flex items-center gap-2"
                >
                    Cancel & Resume
                </button>
                <button
                    onClick={() => handleResume(true)}
                    disabled={resumingIds.has(selectedHitId)}
                    className="px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 flex items-center gap-2 border border-emerald-500/30"
                >
                    {resumingIds.has(selectedHitId) ? (
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                        <FiCheckCircle size={14} />
                    )}
                    Resume with Changes
                </button>
            </div>
        </div>
    );
};
