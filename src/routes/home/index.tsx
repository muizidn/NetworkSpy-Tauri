import SplitPane, { Pane, SashContent } from "split-pane-react";
import { useEffect, useRef, useState } from "react";

import { Header } from "../../packages/header/Header";
import { LeftSidebar } from "../../packages/sidebar/LeftSidebar";
import { RightSidebar } from "../../packages/sidebar/RightSidebar";
import { NSTabs } from "../../packages/ui/NSTabs";
import { CenterPane } from "./CenterPane";
import { BottomPaneOptions } from "../../packages/bottom-pane/BottomPaneOptions";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  TrafficListProvider,
  useTrafficListContext,
} from "../../packages/main-content/context/TrafficList";
import { PaneProvider, usePaneContext } from "../../context/PaneProvider";
import { invoke } from "@tauri-apps/api/tauri";
import { Traffic } from "../../models/Traffic";
import { TrafficItemMap } from "../../packages/main-content/model/TrafficItemMap";
import { TauriEnvProvider, useAppProvider } from "@src/packages/app-env";

const Content = () => {
  const paneSizeConfig = {
    leftPane: {
      min: "10%",
      max: "80%",
    },
    rightPane: {
      min: "10%",
      max: "80%",
    },
  };
  const [sizes, setSizes] = useState<any[]>(["15%", "70%", "15%"]);
  const { setTrafficList, trafficSet, setTrafficSet } = useTrafficListContext();
  const { isDisplayPane, setIsDisplayPane } = usePaneContext();
  const { provider, isRun, setIsRun, clearData } = useAppProvider();

  const [tabs, setTabs] = useState<any[]>(() => {
    const saved = localStorage.getItem("ns_workspace_tabs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((t: any) => ({
          ...t,
          content: <CenterPane />,
        }));
      } catch (e) {
        console.error("Failed to parse saved tabs", e);
      }
    }
    return [];
  });

  useEffect(() => {
    const toSave = tabs.map(({ id, title }) => ({ id, title }));
    localStorage.setItem("ns_workspace_tabs", JSON.stringify(toSave));
  }, [tabs]);

  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab = {
      id: newId,
      title: `New Session ${tabs.length + 1}`,
      content: <CenterPane />,
    };
    setTabs((prev) => [...prev, newTab]);
  };

  const handleCloseTab = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRenameTab = (id: string, newTitle: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
    );
  };

  useEffect(() => {
    if (!isRun) return;

    let unlisten: (() => void) | undefined;

    provider.listenTraffic((traffic) => {
      setTrafficSet((prev) => ({
        ...prev,
        [traffic.id]: traffic,
      }));

      setTrafficList((prevData) => {
        const existingTrafficIndex = prevData.findIndex(
          (t) => t.id === traffic.id
        );

        const listItem: TrafficItemMap = {
          id: traffic.id,
          tags: ["LOGIN DOCKER", "AKAMAI Testing Robot"],
          url: traffic.uri || "-",
          client: "Google Map",
          method: traffic.method,
          status: "Completed",
          code: "200",
          time: "732 ms",
          duration: "16 bytes",
          request: "Request data",
          response: traffic.response ? "Response Data" : "-",
          performance: (traffic as any).performance,
        };

        if (existingTrafficIndex !== -1) {
          const updatedTraffic = {
            ...prevData[existingTrafficIndex],
            ...listItem,
          };
          return [
            ...prevData.slice(0, existingTrafficIndex),
            updatedTraffic,
            ...prevData.slice(existingTrafficIndex + 1),
          ];
        } else {
          return [...prevData, listItem];
        }
      });
    }).then(fn => { unlisten = fn; });

    return () => {
      if (unlisten) unlisten();
    };
  }, [provider, isRun]);

  const getNewSizes = (params: any, index: number) => {
    return sizes.map((size, idx) =>
      idx === index ? (params ? "0%" : "15%") : size
    );
  };

  const toggleLeftPane = () => {
    const isVisible = isDisplayPane.left;
    setIsDisplayPane((prev) => ({ ...prev, left: !isVisible }));
    setSizes((prev) => [!isVisible ? "0%" : "15%", prev[1], prev[2]]);
  };

  const toggleBottomPane = () => {
    setIsDisplayPane((prev) => ({ ...prev, bottom: !prev.bottom }));
  };

  const toggleRightPane = () => {
    const isVisible = isDisplayPane.right;
    setIsDisplayPane((prev) => ({ ...prev, right: !isVisible }));
    setSizes((prev) => [prev[0], prev[1], !isVisible ? "0%" : "15%"]);
  };

  return (
    <div className='select-none flex flex-col h-screen'>
      <Header
        toggleLeftPane={toggleLeftPane}
        toggleBottomPane={toggleBottomPane}
        toggleRightPane={toggleRightPane}
        leftActive={isDisplayPane.left}
        bottomActive={isDisplayPane.bottom}
        rightActive={isDisplayPane.right}
      />
      <div className='flex flex-grow overflow-hidden w-full h-full border-t border-black'>
        <SplitPane
          split='vertical'
          sashRender={() => <SashContent type='vscode' />}
          sizes={sizes}
          onChange={setSizes}>
          <Pane
            minSize={isDisplayPane.left ? paneSizeConfig.leftPane.min : 0}
            maxSize={paneSizeConfig.leftPane.max}>
            <div className='flex items-center justify-center h-full'>
              <LeftSidebar />
            </div>
          </Pane>
          <Pane>
            <div className='flex items-center justify-center h-full relative'>
              <NSTabs
                tabs={tabs}
                onAdd={handleAddTab}
                onClose={handleCloseTab}
                onRename={handleRenameTab}
              />
            </div>
          </Pane>
          <Pane
            minSize={isDisplayPane.right ? paneSizeConfig.rightPane.min : 0}
            maxSize={paneSizeConfig.rightPane.max}>
            <div className='flex items-center justify-center h-full'>
              <RightSidebar />
            </div>
          </Pane>
        </SplitPane>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <TrafficListProvider>
      <TauriEnvProvider>
        <PaneProvider>
          <Content />
        </PaneProvider>
      </TauriEnvProvider>
    </TrafficListProvider>
  );
};

export default App;
