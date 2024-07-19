import SplitPane, { Pane } from "split-pane-react";
import { useState } from "react";

import { Header } from "../../packages/header/Header";
import { LeftSidebar } from "../../packages/sidebar/LeftSidebar";
import { RightSidebar } from "../../packages/sidebar/RightSidebar";
import { NSTabs } from "../../packages/ui/NSTabs";
import { CenterPane } from "./CenterPane";

const App = () => {
  const [sizes, setSizes] = useState(["18%", "75%", "15%"]);

  return (
    <div className='flex flex-col h-screen'>
      <Header />
      <div className='flex flex-grow overflow-hidden'>
        <SplitPane split='vertical' sizes={sizes} onChange={setSizes}>
          <Pane minSize='10%' maxSize='18%'>
            <div className='flex items-center justify-center h-full'>
              <LeftSidebar />
            </div>
          </Pane>
          <Pane>
            <div className='flex items-center justify-center h-full'>
              <NSTabs
                tabs={[
                  {
                    id: "1",
                    title: "Facebook API",
                    content: <CenterPane />,
                  },
                  {
                    id: "2",
                    title: "Local Webserver Test",
                    content: <CenterPane />,
                  },
                ]}
              />
            </div>
          </Pane>
          <Pane minSize='10%' maxSize='18%'>
            <div className='flex items-center justify-center h-full'>
              <RightSidebar />
            </div>
          </Pane>
        </SplitPane>
      </div>
    </div>
  );
};

export default App;
