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

  return (
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
            <div style={{ height: sizesCenterPane[1] }} className="flex flex-col">
              <div className='block w-full bg-[#1e1e1e] z-10'>
                <BottomPaneOptions />
              </div>
              <BottomPane />
            </div>
          </BottomPaneProvider>
        </Pane>
      </SplitPane>
    </div>
  );
};

const NoSelection: React.FC<{}> = ({ }) => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      No traffic selected. Please select one traffic to see detail
    </div>
  );
};
