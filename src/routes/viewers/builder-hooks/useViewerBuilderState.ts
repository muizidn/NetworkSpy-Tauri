import { useState, useEffect, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Viewer, ViewerBlock, ViewerContent, ViewerMatcher, useViewerContext } from "@src/context/ViewerContext";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { useSessionContext } from "@src/context/SessionContext";
import { useAppProvider } from "@src/packages/app-env";
import { getDefaultCode, getDefaultHtml, getDefaultCss } from "../builder-utils/defaults";
import { executeViewerBlock } from "../builder-utils/viewerRunner";

export const useViewerBuilderState = (initialViewer: Viewer) => {
    const { saveViewer } = useViewerContext();
    const { trafficList } = useTrafficListContext();
    const { sessions } = useSessionContext();
    const { provider } = useAppProvider();

    const [viewerName, setViewerName] = useState(initialViewer.name);
    const [isEditingName, setIsEditingName] = useState(false);

    const parsedContent: ViewerContent = useMemo(() => {
        try {
            return JSON.parse(initialViewer.content);
        } catch (e) {
            return { blocks: [] };
        }
    }, [initialViewer.content]);

    const [blocks, setBlocks] = useState<ViewerBlock[]>(parsedContent.blocks);
    const [matchers, setMatchers] = useState<ViewerMatcher[]>(parsedContent.matchers || []);
    const [testSource, setTestSource] = useState<'live' | 'session'>(parsedContent.previewConfig?.testSource || 'live');
    const [selectedSessionId, setSelectedSessionId] = useState<string>(parsedContent.previewConfig?.selectedSessionId || "");
    const [selectedTrafficId, setSelectedTrafficId] = useState<string>(parsedContent.previewConfig?.selectedTrafficId || "");
    const [filter, setFilter] = useState<string>(parsedContent.previewConfig?.filter === "create" ? "" : (parsedContent.previewConfig?.filter || ""));

    const [isToolboxVisible, setIsToolboxVisible] = useState(true);
    const [maximizedBlockId, setMaximizedBlockId] = useState<string | null>(null);
    const [sessionTraffic, setSessionTraffic] = useState<any[]>([]);
    const [testResults, setTestResults] = useState<Record<string, any>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'preview' | 'source' | 'json'>('preview');
    const [isAiAssistantVisible, setIsAiAssistantVisible] = useState(false);

    useEffect(() => {
        if (testSource === 'session' && selectedSessionId) {
            invoke("get_session_traffic", { id: selectedSessionId })
                .then((data: any) => setSessionTraffic(data))
                .catch(console.error);
        } else {
            setSessionTraffic([]);
        }
    }, [testSource, selectedSessionId]);

    const runPreview = useCallback(async () => {
        if (!selectedTrafficId) return;
        setIsRunning(true);
        const results: Record<string, any> = {};

        const executeBlock = async (block: ViewerBlock) => {
            return executeViewerBlock(block, {
                trafficId: selectedTrafficId,
                isReviewMode: testSource === 'session',
                reviewedSessionId: selectedSessionId,
                provider
            });
        };

        const blockPromises = blocks.map(async (block) => {
            results[block.id] = await executeBlock(block);
        });
        
        await Promise.all(blockPromises);

        setTestResults(results);
        setIsRunning(false);
    }, [selectedTrafficId, blocks, testSource, selectedSessionId, provider]);

    useEffect(() => {
        if (selectedTrafficId && blocks.length > 0) {
            runPreview();
        }
    }, [selectedTrafficId, blocks, runPreview]);

    const [externalTrafficItem, setExternalTrafficItem] = useState<any | null>(null);
    const currentDataSource = testSource === 'live' ? trafficList : sessionTraffic;

    // Fetch traffic metadata if the ID is known but the item is missing from the current list
    useEffect(() => {
        if (selectedTrafficId && testSource === 'live') {
            const existsInList = trafficList.some(t => t.id === selectedTrafficId);
            if (!existsInList) {
                provider.getAllMetadata().then(all => {
                    const found = all.find(t => t.id === selectedTrafficId);
                    if (found) setExternalTrafficItem(found);
                });
            } else {
                setExternalTrafficItem(null);
            }
        } else {
            setExternalTrafficItem(null);
        }
    }, [selectedTrafficId, testSource, trafficList, provider]);

    const filteredTraffic = useMemo(() => {
        const baseItems = currentDataSource.filter((t: any) => t.intercepted);
        
        if (!filter.trim()) return baseItems;
        const lowFilter = filter.toLowerCase();
        return baseItems.filter((t: any) =>
            (t.method || "").toLowerCase().includes(lowFilter) ||
            (t.uri || t.url || "").toLowerCase().includes(lowFilter) ||
            t.id.includes(lowFilter)
        );
    }, [currentDataSource, filter]);

    const currentIndex = filteredTraffic.findIndex(t => t.id === selectedTrafficId);
    const selectedTraffic = useMemo(() => {
        const inList = currentDataSource.find(t => t.id === selectedTrafficId);
        return inList || externalTrafficItem;
    }, [currentDataSource, selectedTrafficId, externalTrafficItem]);

    useEffect(() => {
        setViewerName(initialViewer.name);
        setBlocks(parsedContent.blocks);
        setTestSource(parsedContent.previewConfig?.testSource || 'live');
        setSelectedSessionId(parsedContent.previewConfig?.selectedSessionId || "");
        setSelectedTrafficId(parsedContent.previewConfig?.selectedTrafficId || "");
        const savedFilter = parsedContent.previewConfig?.filter || "";
        setFilter(savedFilter === "create" ? "" : savedFilter);
        setMatchers(parsedContent.matchers || []);
    }, [initialViewer, parsedContent]);

    const handleSave = async () => {
        const content: ViewerContent = {
            blocks,
            matchers,
            previewConfig: {
                testSource,
                selectedSessionId,
                filter,
                selectedTrafficId
            }
        };
        await saveViewer(viewerName, JSON.stringify(content), initialViewer.id, initialViewer.folderId);
        alert("Viewer saved successfully!");
    };

    const addBlock = (type: ViewerBlock['type']) => {
        const newBlock: ViewerBlock = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            title: `New ${type.toUpperCase()} Block`,
            code: getDefaultCode(type),
            colSpan: 12,
            html: type === 'html' ? getDefaultHtml() : undefined,
            css: type === 'html' ? getDefaultCss() : undefined,
            padding: type === 'html' ? 0 : 4
        };
        setBlocks(prev => [...prev, newBlock]);
    };

    const injectBlock = (block: ViewerBlock) => {
        setBlocks(prev => [...prev, { ...block, id: block.id || Math.random().toString(36).substr(2, 9) }]);
    };

    const deleteBlock = (id: string) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
    };

    const updateBlock = (id: string, updates: Partial<ViewerBlock>) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const clearBlocks = () => {
        setBlocks([]);
    };

    const goNext = () => {
        if (currentIndex < filteredTraffic.length - 1) {
            setSelectedTrafficId(filteredTraffic[currentIndex + 1].id);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setSelectedTrafficId(filteredTraffic[currentIndex - 1].id);
        }
    };

    return {
        viewerName, setViewerName,
        isEditingName, setIsEditingName,
        blocks, setBlocks,
        matchers, setMatchers,
        testSource, setTestSource,
        selectedSessionId, setSelectedSessionId,
        selectedTrafficId, setSelectedTrafficId,
        filter, setFilter,
        isToolboxVisible, setIsToolboxVisible,
        maximizedBlockId, setMaximizedBlockId,
        testResults,
        isRunning,
        isSourceDialogOpen, setIsSourceDialogOpen,
        viewMode, setViewMode,
        filteredTraffic,
        currentIndex,
        selectedTraffic,
        handleSave,
        addBlock,
        injectBlock,
        deleteBlock,
        updateBlock,
        clearBlocks,
        runPreview,
        goNext,
        goPrev,
        sessions,
        isAiAssistantVisible,
        setIsAiAssistantVisible
    };
};
