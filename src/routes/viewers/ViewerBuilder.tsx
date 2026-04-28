import React from "react";
import { Viewer } from "@src/context/ViewerContext";
import { useViewerBuilderState } from "./builder-hooks/useViewerBuilderState";

// Components
import { BuilderHeader } from "./builder-components/BuilderHeader";
import { Canvas } from "./builder-components/Canvas";
import { Toolbox } from "./builder-components/Toolbox";
import { SourceDialog } from "./builder-components/SourceDialog";
import { FullSourceEditor } from "./builder-components/FullSourceEditor";
import { JsonSourceEditor } from "./builder-components/JsonSourceEditor";
import { AiBuilderSidebar } from "./builder-components/AiBuilderSidebar";

interface ViewerBuilderProps {
    viewer: Viewer;
}

const ViewerBuilder: React.FC<ViewerBuilderProps> = ({ viewer: initialViewer }) => {
    const {
        viewerName, setViewerName,
        isEditingName, setIsEditingName,
        blocks, setBlocks,
        testSource, setTestSource,
        selectedSessionId, setSelectedSessionId,
        selectedTrafficId, setSelectedTrafficId,
        filter, setFilter,
        isToolboxVisible, setIsToolboxVisible,
        maximizedBlockId, setMaximizedBlockId,
        testResults,
        matchers, setMatchers,
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
        runPreview,
        goNext,
        goPrev,
        sessions,
        isAiAssistantVisible,
        setIsAiAssistantVisible
    } = useViewerBuilderState(initialViewer);

    const mainContent = () => {
        switch (viewMode) {
            case 'preview':
                return (
                    <Canvas 
                        blocks={blocks}
                        maximizedBlockId={maximizedBlockId}
                        setMaximizedBlockId={setMaximizedBlockId}
                        testResults={testResults}
                        updateBlock={updateBlock}
                        deleteBlock={deleteBlock}
                    />
                );
            case 'json':
                return (
                    <JsonSourceEditor 
                        blocks={blocks}
                        matchers={matchers}
                        previewConfig={{
                            testSource,
                            selectedSessionId,
                            selectedTrafficId,
                            filter
                        }}
                        onUpdate={(data) => {
                            setBlocks(data.blocks);
                            setMatchers(data.matchers);
                        }}
                    />
                );
            case 'source':
                return (
                    <FullSourceEditor 
                        viewerName={viewerName} 
                        blocks={blocks} 
                        testResults={testResults} 
                    />
                );
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#050505]">
            <BuilderHeader 
                viewerName={viewerName}
                setViewerName={setViewerName}
                isEditingName={isEditingName}
                setIsEditingName={setIsEditingName}
                isToolboxVisible={isToolboxVisible}
                setIsToolboxVisible={setIsToolboxVisible}
                isAiAssistantVisible={isAiAssistantVisible}
                setIsAiAssistantVisible={setIsAiAssistantVisible}
                handleSave={handleSave}
                blocks={blocks}
                testResults={testResults}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 flex overflow-hidden">
                    {mainContent()}
                </div>

                <Toolbox 
                    isVisible={isToolboxVisible}
                    maximizedBlockId={maximizedBlockId}
                    selectedTraffic={selectedTraffic}
                    testSource={testSource}
                    setIsSourceDialogOpen={setIsSourceDialogOpen}
                    goPrev={goPrev}
                    goNext={goNext}
                    currentIndex={currentIndex}
                    totalTraffic={filteredTraffic.length}
                    runPreview={runPreview}
                    isRunning={isRunning}
                    addBlock={addBlock}
                    matchers={matchers}
                    setMatchers={setMatchers}
                />

                <AiBuilderSidebar 
                    isVisible={isAiAssistantVisible}
                    onClose={() => setIsAiAssistantVisible(false)}
                    blocks={blocks}
                    onInjectBlock={injectBlock}
                />
            </div>

            <SourceDialog 
                isOpen={isSourceDialogOpen}
                onClose={() => setIsSourceDialogOpen(false)}
                testSource={testSource}
                setTestSource={setTestSource}
                selectedSessionId={selectedSessionId}
                setSelectedSessionId={setSelectedSessionId}
                selectedTrafficId={selectedTrafficId}
                setSelectedTrafficId={setSelectedTrafficId}
                filter={filter}
                setFilter={setFilter}
                filteredTraffic={filteredTraffic}
                sessions={sessions}
            />
        </div>
    );
};

export default ViewerBuilder;
