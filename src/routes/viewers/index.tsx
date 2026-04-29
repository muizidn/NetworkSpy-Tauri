import React from "react";
import { useAtom } from "jotai";
import { activeViewerBuilderAtom } from "@src/utils/viewerBuilderAtoms";
import { twMerge } from "tailwind-merge";

import ViewerList from "@src/routes/viewers/ViewerList";
import ViewerBuilder from "@src/routes/viewers/ViewerBuilder";
import { Viewer } from "@src/context/ViewerContext";
import { useSettingsContext } from "@src/context/SettingsProvider";
import { FiLock, FiZap, FiEye, FiCpu, FiLayers } from "react-icons/fi";

const ViewersPage: React.FC = () => {
    const [selectedViewer, setSelectedViewer] = useAtom(activeViewerBuilderAtom);
    const { plan, isVerified } = useSettingsContext();

    const isPro = isVerified && plan?.toLowerCase() === "pro";

    if (!isPro) {
        return (
            <div className="flex flex-col h-full bg-[#050505] items-center justify-center p-12 overflow-y-auto">
                <div className="max-w-xl w-full">
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/20 rounded-[2rem] flex items-center justify-center text-blue-500 mx-auto mb-8 shadow-[0_0_50px_rgba(37,99,235,0.1)]">
                            <FiEye size={40} />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-4 uppercase">Custom Viewer Builder</h1>
                        <p className="text-zinc-500 leading-relaxed">
                            Create tailored inspection UIs for your proprietary protocols and data formats. Perfect for teams working on custom internal APIs.
                        </p>
                    </div>

                    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-[2.5rem] p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none">
                            <FiCpu size={200} />
                        </div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-8">
                                <FiLock size={10} className="mr-1" />
                                Pro Feature
                            </div>

                            <h2 className="text-2xl font-black text-white mb-8">Unlock Advanced Extensibility</h2>

                            <div className="space-y-6 mb-12">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 shrink-0">
                                        <FiZap size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">Visual Builder</h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed">Drag and drop components to build complex viewers without writing code.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-500 shrink-0">
                                        <FiCpu size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">Scriptable Logic</h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed">Use JavaScript to transform and beautify any data format into interactive views.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => window.open('https://networkspy.pro/pricing', '_blank')}
                                className="w-full py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-xl hover:shadow-blue-500/30 flex items-center justify-center gap-3"
                            >
                                Upgrade to Pro
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-10">
                        Available on the NetworkSpy Professional Plan
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-[#050505] overflow-hidden">
            {!selectedViewer && (
                <div className="border-r border-zinc-900 flex flex-col h-full bg-[#080808] w-80 animate-in slide-in-from-left duration-300">
                    <ViewerList
                        onSelectViewer={setSelectedViewer}
                    />
                </div>
            )}

            <div className="flex-1 h-full overflow-hidden">
                {selectedViewer ? (
                    <ViewerBuilder
                        viewer={selectedViewer}
                        onBack={() => setSelectedViewer(null)}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-6 bg-[#050505] animate-in fade-in duration-500">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-blue-600/5 flex items-center justify-center border border-blue-500/10 shadow-[0_0_50px_rgba(37,99,235,0.05)]">
                                <FiLayers size={40} className="text-blue-500/20" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 animate-bounce">
                                <FiZap size={16} />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Viewer Builder</h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] max-w-[200px] leading-relaxed mx-auto">
                                Select a viewer from the list to start crafting your custom inspection UI
                            </p>
                        </div>
                        <div className="w-px h-12 bg-gradient-to-b from-blue-500/20 to-transparent"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewersPage;
