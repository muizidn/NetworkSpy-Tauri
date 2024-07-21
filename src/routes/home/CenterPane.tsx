import { useState } from "react";
import SplitPane, { Pane } from "split-pane-react";

import { BottomPane } from "../../packages/bottom-pane/BottomPane";
import { FilterBar } from "../../packages/filter-bar/FilterBar";
import { MainContent } from "../../packages/main-content/MainContent";
import { useSettingsContext } from "../../context/SettingsProvider";

export const CenterPane: React.FC = () => {
  const { sizesCenterPane, setSizesCenterPane } = useSettingsContext();

  return (
    <div className='flex flex-col h-screen'>
      <div>
        <FilterBar />
      </div>
      <SplitPane
        split='horizontal'
        sizes={sizesCenterPane}
        onChange={setSizesCenterPane}
        sashRender={() => null}>
        <Pane minSize='0%' maxSize='85%'>
          <div className='bg-[#23262a] overflow-auto'>
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
