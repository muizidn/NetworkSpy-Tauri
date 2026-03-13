import React, { useEffect, useState, useRef } from "react";
import SplitPane, { Pane, SashContent } from "split-pane-react";

import { BottomPane } from "../../packages/bottom-pane/BottomPane";
import { FilterBar } from "../../packages/filter-bar/FilterBar";
import { MainContent } from "../../packages/main-content/MainContent";
import { useSettingsContext } from "../../context/SettingsProvider";
import { TrafficItemMap } from "../../packages/main-content/model/TrafficItemMap";
import { usePaneContext } from "../../context/PaneProvider";
import { useTrafficListContext } from "../../packages/main-content/context/TrafficList";
import { BottomPaneProvider } from "@src/context/BottomPaneContext";
import { BottomPaneOptions } from "@src/packages/bottom-pane/BottomPaneOptions";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { FilterProvider } from "@src/context/FilterContext";

export const CenterPane: React.FC = () => {
  const { sizesCenterPane, setSizesCenterPane } = useSettingsContext();
  const { isDisplayPane } = usePaneContext();
  const { selections } = useTrafficListContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const [restoredHeight, setRestoredHeight] = useState(300);
  const [isNearBoundary, setIsNearBoundary] = useState(false);

  useEffect(() => {
    const updateInitialSizes = () => {
      if (containerRef.current) {
        const totalHeight = containerRef.current.clientHeight;
        // If sizes are 0,0 (initial state), set a default 60/40 split
        if (sizesCenterPane[0] === 0 && sizesCenterPane[1] === 0) {
          const topHeight = Math.floor(totalHeight * 0.6);
          const bottomHeight = totalHeight - topHeight;
          setSizesCenterPane([topHeight, bottomHeight]);
          setRestoredHeight(topHeight);
        }
      }
    };

    updateInitialSizes();

    const observer = new ResizeObserver(updateInitialSizes);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const toggleMaximize = () => {
    if (containerRef.current) {
      const totalHeight = containerRef.current.clientHeight;
      if (sizesCenterPane[0] === 0) {
        // Restore
        const topHeight = restoredHeight > 0 ? restoredHeight : Math.floor(totalHeight * 0.6);
        setSizesCenterPane([topHeight, totalHeight - topHeight]);
      } else {
        // Maximize bottom
        setRestoredHeight(sizesCenterPane[0]);
        setSizesCenterPane([0, totalHeight]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      const boundaryY = sizesCenterPane[0];

      const topHeight = sizesCenterPane[0];
      const bottomHeight = sizesCenterPane[1];

      // Calculate 10% hit zones
      const topTrigger = boundaryY - (topHeight * 0.1);
      const bottomTrigger = boundaryY + (bottomHeight * 0.1);

      setIsNearBoundary(mouseY >= topTrigger && mouseY <= bottomTrigger);
    }
  };

  const isMaximized = sizesCenterPane[0] === 0;
  return (
    <FilterProvider>
      <div className="flex flex-col h-full">
        <div className="w-full">
          <FilterBar />
        </div>
        <div
          ref={containerRef}
          className="w-full flex-1 min-h-0 relative group/center-pane"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setIsNearBoundary(false)}
        >
          <SplitPane
            className="h-full"
            split="horizontal"
            sashRender={() => <SashContent type="vscode" />}
            sizes={sizesCenterPane}
            onChange={setSizesCenterPane}
          >
            <Pane minSize="0%" maxSize="85%">
              <div
                style={{ height: sizesCenterPane[0] }}
                className="bg-[#23262a] overflow-auto"
              >
                <MainContent />
              </div>
            </Pane>
            <Pane>
              <BottomPaneProvider>
                <div
                  style={{ height: sizesCenterPane[1] }}
                  className="flex flex-col relative"
                >
                  <div className='w-full bg-[#1e1e1e] z-10'>
                    <BottomPaneOptions />
                  </div>
                  <BottomPane />
                </div>
              </BottomPaneProvider>
            </Pane>
          </SplitPane>

          <button
            onClick={toggleMaximize}
            style={{ bottom: sizesCenterPane[1] }}
            className={twMerge(
              "absolute left-1/2 -translate-x-1/2 z-[1000]",
              "flex flex-col items-center gap-0.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-2xl group/maximize-btn rounded-full border",
              "backdrop-blur-md",
              // Logic: 
              // 1. If maximized: Always big and floating, but dimmed when not near
              // 2. If not maximized: Small peek when not near, big when near
              isMaximized
                ? (isNearBoundary
                  ? "px-10 py-1.5 opacity-100 -translate-y-3 bg-blue-600/90 border-blue-400/40 shadow-blue-500/40 pointer-events-auto"
                  : "px-6 py-1 opacity-20 -translate-y-3 bg-blue-600/40 border-blue-400/10 shadow-none pointer-events-auto")
                : (isNearBoundary
                  ? "px-10 py-1.5 opacity-100 -translate-y-3 bg-blue-600/90 border-blue-400/40 shadow-blue-500/40 pointer-events-auto"
                  : "px-4 py-0.5 opacity-30 translate-y-[calc(100%-6px)] bg-transparent border-transparent shadow-none pointer-events-none"),
              "hover:px-10 hover:py-1.5 hover:bg-blue-500 hover:scale-105 active:scale-95 hover:border-blue-200 hover:opacity-100 hover:!-translate-y-3 hover:shadow-blue-500/40 hover:pointer-events-auto"
            )}
            title={isMaximized ? "Restore size" : "Maximize bottom pane"}
          >
            <div className="w-8 h-1 bg-blue-300/60 rounded-full group-hover/maximize-btn:bg-white/80 transition-colors" />
            <div className={twMerge(
              "flex flex-col items-center transition-all duration-300",
              (isMaximized || isNearBoundary) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 h-0"
            )}>
              {isMaximized ? (
                <FiChevronDown size={14} className="text-white group-hover/maximize-btn:scale-110 transition-transform" />
              ) : (
                <FiChevronUp size={14} className="text-white group-hover/maximize-btn:scale-110 transition-transform" />
              )}
            </div>
          </button>
        </div>
      </div>
    </FilterProvider>
  );
};

const NoSelection: React.FC<{}> = ({ }) => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      No traffic selected. Please select one traffic to see detail
    </div>
  );
};
