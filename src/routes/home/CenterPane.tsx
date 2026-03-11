import { useEffect, useState } from "react";
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

  useEffect(() => {
    setSizesPane();
  }, [isDisplayPane]);

  const setSizesPane = () => {
    setSizesCenterPane([300, 580]);
  };

  const toggleMaximize = () => {
    if (sizesCenterPane[0] === 0) {
      setSizesCenterPane([300, 580]);
    } else {
      setSizesCenterPane([0, sizesCenterPane[0] + sizesCenterPane[1]]);
    }
  };

  return (
    <FilterProvider>
      <div className="flex flex-col h-full">
        <div className="w-full">
          <FilterBar />
        </div>
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
              <div style={{ height: sizesCenterPane[1] }} className="flex flex-col relative group/bottom-pane">
                <button
                  onClick={toggleMaximize}
                  className={twMerge(
                    "absolute top-0 left-1/2 -translate-x-1/2 z-[100]",
                    "flex flex-col items-center gap-0.5 px-4 py-1 bg-blue-600/90 backdrop-blur-sm border-x border-b border-blue-500 rounded-b-xl",
                    "transition-all duration-300 ease-in-out shadow-2xl group/maximize-btn",
                    // Default state: Hidden/Pushed up
                    "-translate-y-full opacity-0",
                    // Peek state: When bottom area is hovered
                    "group-hover/bottom-pane:-translate-y-[70%] group-hover/bottom-pane:opacity-60",
                    // Full show state: When the button itself is hovered
                    "hover:!translate-y-0 hover:!opacity-100 hover:bg-blue-500"
                  )}
                  title={sizesCenterPane[0] === 0 ? "Restore size" : "Maximize bottom pane"}
                >
                  <div className="w-8 h-1 bg-blue-400/50 rounded-full group-hover/maximize-btn:bg-blue-200 transition-colors" />
                  {sizesCenterPane[0] === 0 ? (
                    <FiChevronDown size={12} className="text-blue-100/70 group-hover/maximize-btn:text-white" />
                  ) : (
                    <FiChevronUp size={12} className="text-blue-100/70 group-hover/maximize-btn:text-white" />
                  )}
                </button>
                <div className='w-full bg-[#1e1e1e] z-10'>
                  <BottomPaneOptions />
                </div>
                <BottomPane />
              </div>
            </BottomPaneProvider>
          </Pane>
        </SplitPane>
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
