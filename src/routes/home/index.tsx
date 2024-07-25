import SplitPane, { Pane } from "split-pane-react";
import { useEffect, useRef, useState } from "react";

import { Header } from "../../packages/header/Header";
import { LeftSidebar } from "../../packages/sidebar/LeftSidebar";
import { RightSidebar } from "../../packages/sidebar/RightSidebar";
import { NSTabs } from "../../packages/ui/NSTabs";
import { CenterPane } from "./CenterPane";
import { BottomPaneOptions } from "../../packages/bottom-pane/BottomPaneOptions";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { listen } from "@tauri-apps/api/event";
import {
  TrafficListProvider,
  useTrafficListContext,
} from "../../packages/main-content/context/TrafficList";

const Content = () => {
  const [sizes, setSizes] = useState(["18%", "75%", "15%"]);
  const [isRun, setIsRun] = useState(true);
  const streamState = useRef(false);
  const { data, setData } = useTrafficListContext();

  useEffect(() => {
    setData([
      {
        id: "0",
        tags: ["LOGIN DOCKER", "AKAMAI Testing Robot"],
        url: "https://example.com",
        client: "Google Map",
        method: "GET",
        status: "Completed",
        code: "200",
        time: "732 ms",
        duration: "16 bytes",
        request: "Request Details",
        response: "Response Details",
      },
    ]);
  }, []);

  useEffect(() => {
    if (streamState.current) {
      return;
    }
    streamState.current = true;
    listen("count_event", (event: any) => {
      setData((prevData) => [
        ...prevData,
        {
          id: (event.payload as any).message as string,
          tags: ["LOGIN DOCKER", "AKAMAI Testing Robot"],
          url: "https://example.com",
          client: "Google Map",
          method: "GET",
          status: "Completed",
          code: "200",
          time: "732 ms",
          duration: "16 bytes",
          request: "Request Details",
          response: "Response Details",
        },
      ]);
    });
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="select-none flex flex-col h-screen">
        <Header />
        <button onClick={() => setIsRun((prev) => !prev)}>
          {isRun ? "PAUSE" : "RUN"}
        </button>
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
                    {
                      id: "2",
                      title: "Local Webserver",
                      content: <CenterPane />,
                    },
                    {
                      id: "3",
                      title: "GraphQL API Instragram",
                      content: <CenterPane />,
                    },
                    {
                      id: "4",
                      title: "Machine Learning Prediction",
                      content: <CenterPane />,
                    },
                    {
                      id: "5",
                      title: "LLM API TomioAI",
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

const App: React.FC = () => {
  return (
    <TrafficListProvider>
      <Content />
    </TrafficListProvider>
  );
};

export default App;
