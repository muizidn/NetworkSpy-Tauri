import SplitPane, { Pane, SashContent } from "split-pane-react";
import { useState } from "react";

import { RequestTab } from "./RequestTab";
import { ResponseTab } from "./ResponseTab";
import { SelectionViewer } from "../main-content/SelectionViewer";
import { useSettingsContext } from "../../context/SettingsProvider";

export const BottomPane = () => {
  const { sizesCenterPane } = useSettingsContext();
  const [sizes, setSizes] = useState<any[]>(["50%", "50%"]);

  return (
    <div className='flex flex-col w-full h-full relative'>
      <SelectionViewer />
      <div style={{ height: sizesCenterPane[1] - 195 }}>
        <SplitPane split='vertical' 
          sashRender={() => <SashContent type="vscode" />}
          sizes={sizes} onChange={setSizes}>
          <Pane minSize='20%' maxSize='80%'>
            <div className='h-full no-scrollbar flex items-center justify-center overflow-auto'>
              <RequestTab />
            </div>
          </Pane>
          <div className='h-full no-scrollbar flex items-center justify-center overflow-auto border-l border-black'>
            <ResponseTab />
          </div>
        </SplitPane>
      </div>
    </div>
  );
};
