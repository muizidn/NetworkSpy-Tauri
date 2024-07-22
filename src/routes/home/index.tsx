import SplitPane, { Pane } from "split-pane-react";
import { useState } from "react";

import { Header } from "../../packages/header/Header";
import { LeftSidebar } from "../../packages/sidebar/LeftSidebar";
import { RightSidebar } from "../../packages/sidebar/RightSidebar";
import { NSTabs } from "../../packages/ui/NSTabs";
import { CenterPane } from "./CenterPane";
import { BottomPaneOptions } from "../../packages/bottom-pane/BottomPaneOptions";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const App = () => {
  const [sizes, setSizes] = useState(["18%", "75%", "15%"]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex flex-grow overflow-hidden w-full h-full border-t border-black">
          <SplitPane split="vertical" sizes={sizes} onChange={setSizes}>
            <Pane minSize="10%" maxSize="18%">
              <div className="flex items-center justify-center h-full">
                <LeftSidebar />
              </div>
            </Pane>
            <Pane>
              <div className="flex items-center justify-center h-full relative">
                <NSTabs
                  tabs={[
                    {
                      id: "1",
                      title: "Facebook API",
                      content: <CenterPane />,
                    },
                  ]}
                />
                <div className="absolute bottom-0 w-full bg-[#1e1e1e] z-10">
                  <BottomPaneOptions />
                </div>
              </div>
            </Pane>
            <Pane minSize="10%" maxSize="18%">
              <div className="flex items-center justify-center h-full">
                <RightSidebar />
              </div>
            </Pane>
          </SplitPane>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;
