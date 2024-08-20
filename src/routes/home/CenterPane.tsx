import { useEffect, useState } from "react";
import SplitPane, { Pane, SashContent } from "split-pane-react";

import { BottomPane } from "../../packages/bottom-pane/BottomPane";
import { FilterBar } from "../../packages/filter-bar/FilterBar";
import { MainContent } from "../../packages/main-content/MainContent";
import { useSettingsContext } from "../../context/SettingsProvider";
import { TrafficItemMap } from "../../packages/main-content/model/TrafficItemMap";
import { usePaneContext } from "../../context/PaneProvider";

export const CenterPane: React.FC = () => {
  const { sizesCenterPane, setSizesCenterPane } = useSettingsContext();
  const { isDisplayPane } = usePaneContext();

  useEffect(() => {
    setSizesPane();
  }, [isDisplayPane]);

  const setSizesPane = () => {
    const newSizes = sizesCenterPane.map((size, idx) =>
      idx === 1 ? (isDisplayPane.bottom ? 580 : 0) : size
    );
    setSizesCenterPane(newSizes);
  };

  return (
    <div className='flex flex-col h-screen'>
      <div>
        <FilterBar />
      </div>
      <SplitPane
        split='horizontal'
        sashRender={() => <SashContent type='vscode' />}
        sizes={sizesCenterPane}
        onChange={setSizesCenterPane}>
        <Pane minSize='0%' maxSize='85%'>
          <div
            style={{ height: sizesCenterPane[0] }}
            className='bg-[#23262a] overflow-auto'>
            <MainContent />
          </div>
        </Pane>
        <Pane>
          <div style={{ height: sizesCenterPane[1] }}>
            <BottomPane />
          </div>
        </Pane>
      </SplitPane>
    </div>
  );
};
