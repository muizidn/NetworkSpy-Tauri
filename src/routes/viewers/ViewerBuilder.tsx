import React from "react";
import { Viewer } from "@src/context/ViewerContext";
import { useViewerBuilderState } from "./builder-hooks/useViewerBuilderState";

// Components
import { BuilderHeader } from "./builder-components/BuilderHeader";
import { Canvas } from "./builder-components/Canvas";
import { Toolbox } from "./builder-components/Toolbox";
import { SourceDialog } from "./builder-components/SourceDialog";

interface ViewerBuilderProps {
    viewer: Viewer;
}

const ViewerBuilder: React.FC<ViewerBuilderProps> = ({ viewer: initialViewer }) => {
    const {
        viewerName, setViewerName,
        isEditingName, setIsEditingName,
        blocks,
        testSource, setTestSource,
        selectedSessionId, setSelectedSessionId,
        selectedTrafficId, setSelectedTrafficId,
        filter, setFilter,
        isToolboxVisible, setIsToolboxVisible,
        maximizedBlockId, setMaximizedBlockId,
        testResults,
        isRunning,
        isSourceDialogOpen, setIsSourceDialogOpen,
        filteredTraffic,
        currentIndex,
        selectedTraffic,
        handleSave,
        addBlock,
        deleteBlock,
        updateBlock,
        runPreview,
        goNext,
        goPrev,
        sessions
    } = useViewerBuilderState(initialViewer);

    return (
        <div className="flex flex-col h-full bg-[#050505]">
            <BuilderHeader 
                viewerName={viewerName}
                setViewerName={setViewerName}
                isEditingName={isEditingName}
                setIsEditingName={setIsEditingName}
                isToolboxVisible={isToolboxVisible}
                setIsToolboxVisible={setIsToolboxVisible}
                handleSave={handleSave}
            />

            <div className="flex-1 flex overflow-hidden relative">
                <Canvas 
                    blocks={blocks}
                    maximizedBlockId={maximizedBlockId}
                    setMaximizedBlockId={setMaximizedBlockId}
                    testResults={testResults}
                    updateBlock={updateBlock}
                    deleteBlock={deleteBlock}
                />

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
