import SplitPane, { Pane } from "split-pane-react";
import { useState } from "react";

import { BottomPaneOptions } from "./BottomPaneOptions";
import { RequestTab } from "./RequestTab";
import { ResponseTab } from "./ResponseTab";

export const BottomPane = () => {
  const [sizes, setSizes] = useState(["50%", "50%"]);

  return (
    <div className='flex flex-col w-full h-full'>
      <div className='h-screen pb-10'>
        <SplitPane split='vertical' sizes={sizes} onChange={setSizes}>
          <Pane minSize='20%' maxSize='80%'>
            <div className='border-r border-gray-400 flex items-center justify-center'>
              <RequestTab />
            </div>
          </Pane>
          <div className='flex items-center justify-center h-full'>
            <ResponseTab />
          </div>
        </SplitPane>
      </div>
      <div className='absolute bottom-0 w-full bg-[#1e1e1e] z-10'>
        <BottomPaneOptions />
      </div>
    </div>
  );
};
