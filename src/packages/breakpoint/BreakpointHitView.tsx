import React, { useEffect, useState, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { useAppProvider } from "../app-env";
import { BreakpointData } from "../app-env/AppProvider";
import { BreakpointSidebar } from "./components/BreakpointSidebar";
import { BreakpointEmptyState } from "./components/BreakpointEmptyState";
import { BreakpointEditorHeader } from "./components/BreakpointEditorHeader";
import { BreakpointBodyEditor } from "./components/BreakpointBodyEditor";
import { BreakpointHeadersEditor } from "./components/BreakpointHeadersEditor";

export const BreakpointHitView: React.FC = () => {
    const { pausedBreakpoints, resumeBreakpoint, getPausedData, refreshBreakpoints } = useAppProvider();
    const [selectedHitId, setSelectedHitId] = useState<string | null>(null);
    const [dataCache, setDataCache] = useState<Record<string, BreakpointData>>({});
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [resumingIds, setResumingIds] = useState<Set<string>>(new Set());

    // Use memo to derive selectedData from cache
    const selectedData = useMemo(() =>
        selectedHitId ? dataCache[selectedHitId] : null
        , [selectedHitId, dataCache]);

    // Editor state
    const [editedBody, setEditedBody] = useState("");
    const [editedHeaders, setEditedHeaders] = useState<{ key: string, value: string }[]>([]);
    const [activeTab, setActiveTab] = useState<"headers" | "body">("body");

    useEffect(() => {
        let isCancelled = false;

        if (selectedHitId && !dataCache[selectedHitId]) {
            setIsLoadingData(true);

            const fetchData = async () => {
                try {
                    const data = await getPausedData(selectedHitId);
                    if (!isCancelled) {
                        setDataCache(prev => ({ ...prev, [selectedHitId]: data }));

                        // Convert body to string for initial edit state if this is the first load
                        const bodyStr = new TextDecoder().decode(new Uint8Array(data.body));
                        setEditedBody(bodyStr);

                        const headersArr = Object.entries(data.headers).map(([k, v]) => ({ key: k, value: v }));
                        setEditedHeaders(headersArr);
                    }
                } catch (e) {
                    console.error("Failed to load breakpoint data for ID:", selectedHitId, e);
                } finally {
                    if (!isCancelled) setIsLoadingData(false);
                }
            };

            fetchData();
        } else if (selectedHitId && dataCache[selectedHitId]) {
            // Data is already in cache, just update editor state if switched
            const data = dataCache[selectedHitId];
            const bodyStr = new TextDecoder().decode(new Uint8Array(data.body));
            setEditedBody(bodyStr);
            const headersArr = Object.entries(data.headers).map(([k, v]) => ({ key: k, value: v }));
            setEditedHeaders(headersArr);
        }

        return () => { isCancelled = true; };
    }, [selectedHitId, getPausedData, dataCache]);

    // Handle when a hit is resumed by another window/process
    useEffect(() => {
        if (selectedHitId && !pausedBreakpoints.find(p => p.id === selectedHitId)) {
            setSelectedHitId(null);
        }
    }, [pausedBreakpoints, selectedHitId]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshBreakpoints();
            // Minimum wait for satisfying animation
            await new Promise(r => setTimeout(r, 800));
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleResume = async (withModifications = false) => {
        if (!selectedHitId) return;

        setResumingIds(prev => new Set(prev).add(selectedHitId));
        try {
            let modifiedData: BreakpointData | undefined = undefined;

            if (withModifications && selectedData) {
                const bodyUint8 = new TextEncoder().encode(editedBody);
                const headersObj: Record<string, string> = {};
                editedHeaders.forEach(h => {
                    if (h.key.trim()) headersObj[h.key] = h.value;
                });

                modifiedData = {
                    ...selectedData,
                    body: Array.from(bodyUint8),
                    headers: headersObj
                };
            }

            await resumeBreakpoint(selectedHitId, modifiedData);

            // Clean up cache
            setDataCache(prev => {
                const next = { ...prev };
                delete next[selectedHitId];
                return next;
            });
            setSelectedHitId(null);
        } finally {
            setResumingIds(prev => {
                const next = new Set(prev);
                next.delete(selectedHitId);
                return next;
            });
        }
    };

    const handleResumeAll = async () => {
        const ids = pausedBreakpoints.map(b => b.id);
        ids.forEach(id => setResumingIds(prev => new Set(prev).add(id)));
        try {
            for (const id of ids) {
                await resumeBreakpoint(id);
            }
        } finally {
            setResumingIds(new Set());
        }
    };

    console.log(selectedData)

    return (
        <div className="w-full h-screen bg-[#050505] flex overflow-hidden text-zinc-100 font-sans selection:bg-blue-500/30">
            <BreakpointSidebar
                pausedBreakpoints={pausedBreakpoints}
                selectedHitId={selectedHitId}
                setSelectedHitId={setSelectedHitId}
                handleResumeAll={handleResumeAll}
                handleRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />


            <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden">
                {selectedHitId && selectedData ? (
                    <>
                        <BreakpointEditorHeader
                            selectedHitId={selectedHitId}
                            selectedData={selectedData}
                            resumingIds={resumingIds}
                            handleResume={handleResume}
                        />

                        <div className="px-8 border-b border-zinc-800 bg-[#080808] flex items-center gap-8">
                            <button
                                onClick={() => setActiveTab("body")}
                                className={twMerge(
                                    "py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                                    activeTab === "body" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                Payload Body
                                {activeTab === "body" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
                            </button>
                            <button
                                onClick={() => setActiveTab("headers")}
                                className={twMerge(
                                    "py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                                    activeTab === "headers" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                Headers ({editedHeaders.length})
                                {activeTab === "headers" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col p-6 bg-[#050505]">
                            {activeTab === "body" ? (
                                <BreakpointBodyEditor editedBody={editedBody} setEditedBody={setEditedBody} />
                            ) : (
                                <BreakpointHeadersEditor editedHeaders={editedHeaders} setEditedHeaders={setEditedHeaders} />
                            )}
                        </div>
                    </>
                ) : (
                    <BreakpointEmptyState isLoadingData={isLoadingData} />
                )}
            </div>
        </div>
    );
};
