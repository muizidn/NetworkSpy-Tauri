import React from "react";
import { FiDatabase, FiSettings, FiChevronLeft, FiChevronRight, FiPlay } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

interface TestContextOverlayProps {
    selectedTraffic: any | null;
    testSource: 'live' | 'session';
    setIsSourceDialogOpen: (open: boolean) => void;
    goPrev: () => void;
    goNext: () => void;
    currentIndex: number;
    totalTraffic: number;
    runPreview: () => void;
    isRunning: boolean;
}

export const TestContextOverlay: React.FC<TestContextOverlayProps> = ({
    selectedTraffic, testSource, setIsSourceDialogOpen,
    goPrev, goNext, currentIndex, totalTraffic,
    runPreview, isRunning
}) => {
    if (!selectedTraffic) {
        return (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                <button
                    onClick={() => setIsSourceDialogOpen(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-2xl group"
                >
                    <FiDatabase size={18} className="opacity-50 group-hover:opacity-100" />
                    <span className="text-[11px] font-bold">Set test data source</span>
                </button>
            </div>
        );
    }

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 bg-[#0d0d0f]/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status & Method */}
            <div className="flex items-center gap-3 pr-4 border-r border-zinc-800">
                <div className={twMerge(
                    "w-2 h-2 rounded-full",
                    testSource === 'live' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                )}></div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span className={twMerge(
                            "px-1 py-0.5 rounded-[4px] text-[8px] font-bold",
                            selectedTraffic.method === 'GET' ? "bg-green-500/10 text-green-500" :
                            selectedTraffic.method === 'POST' ? "bg-blue-500/10 text-blue-500" : "bg-zinc-800 text-zinc-400"
                        )}>
                            {selectedTraffic.method}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 max-w-[150px] truncate">
                            {selectedTraffic.uri || selectedTraffic.url}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setIsSourceDialogOpen(true)}
                    className="p-1.5 text-zinc-600 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                >
                    <FiSettings size={14} />
                </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 px-2 border-r border-zinc-800">
                <button
                    onClick={goPrev}
                    disabled={currentIndex <= 0}
                    className="p-2 text-zinc-500 hover:text-white disabled:opacity-20 transition-colors"
                >
                    <FiChevronLeft size={18} />
                </button>
                <div className="min-w-[60px] text-center text-[10px] font-black text-zinc-500 font-mono">
                    {currentIndex + 1} <span className="opacity-30">/</span> {totalTraffic}
                </div>
                <button
                    onClick={goNext}
                    disabled={currentIndex >= totalTraffic - 1}
                    className="p-2 text-zinc-500 hover:text-white disabled:opacity-20 transition-colors"
                >
                    <FiChevronRight size={18} />
                </button>
            </div>

            {/* Run Action */}
            <button
                onClick={runPreview}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white rounded-xl text-[10px] font-bold transition-all shadow-lg shadow-blue-500/20"
            >
                {isRunning ? (
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                    <FiPlay size={12} className="fill-current" />
                )}
                {isRunning ? "Running" : "Test"}
            </button>
        </div>
    );
};
