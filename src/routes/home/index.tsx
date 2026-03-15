import { useEffect, useState } from "react";
import SplitPane, { Pane, SashContent } from "split-pane-react";

import { TauriEnvProvider, useAppProvider } from "@src/packages/app-env";
import { Traffic } from "../../models/Traffic";
import { PaneProvider, usePaneContext } from "../../context/PaneProvider";
import { useSessionContext } from "../../context/SessionContext";
import { HeaderLeft, HeaderRight } from "@src/packages/header/Header";
import {
  TrafficListProvider,
  useTrafficListContext,
} from "@src/packages/main-content/context/TrafficList";
import { TrafficItemMap } from "@src/packages/main-content/model/TrafficItemMap";
import { LeftSidebar } from "@src/packages/sidebar/LeftSidebar";
import { RightSidebar } from "@src/packages/sidebar/RightSidebar";
import { NSTabs } from "@src/packages/ui/NSTabs";
import { CenterPane } from "./CenterPane";

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
  const [sizes, setSizes] = useState<any[]>(() => {
    const saved = localStorage.getItem("ns_main_window_sizes");
    return saved ? JSON.parse(saved) : ["70%", "15%"];
  });

  useEffect(() => {
    localStorage.setItem("ns_main_window_sizes", JSON.stringify(sizes));
  }, [sizes]);
  const { setTrafficList, trafficSet, setTrafficSet } = useTrafficListContext();
  const { isDisplayPane, setIsDisplayPane } = usePaneContext();
  const { provider, isRun, setIsRun, clearData } = useAppProvider();
  const { isReviewMode } = useSessionContext();

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
    if (isReviewMode) return;

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

        const formatBytes = (bytes: number) => {
          if (bytes === 0) return "0 B";
          const k = 1024;
          const sizes = ["B", "KB", "MB", "GB"];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        };

        const listItem: TrafficItemMap = {
          id: traffic.id,
          tags: traffic.tags || [],
          url: traffic.uri || "-",
          client: traffic.client || "Local",
          method: traffic.method,
          code: traffic.response?.status_code?.toString() || "-",
          time: traffic.time,
          duration: traffic.duration || "0 ms",
          request: formatBytes(traffic.request.size),
          response: traffic.response ? formatBytes(traffic.response.size) : "-",
          performance: (traffic as any).performance,
          intercepted: traffic.intercepted,
          timestamp: traffic.timestamp,
        };

        if (existingTrafficIndex !== -1) {
          const updatedTraffic = {
            ...prevData[existingTrafficIndex],
            ...listItem,
            tags: traffic.tags && traffic.tags.length > 0 ? traffic.tags : prevData[existingTrafficIndex].tags,
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

    let unlistenTags: (() => void) | undefined;
    provider.listenTagsUpdated((event) => {
      setTrafficList((current) => current.map(item => {
        if (item.id === event.id) {
           return { ...item, tags: event.tags };
        }
        return item;
      }));
    }).then(fn => { unlistenTags = fn; });

    return () => {
      if (unlisten) unlisten();
      if (unlistenTags) unlistenTags();
    };
  }, [provider, isRun, isReviewMode]);

  const getNewSizes = (params: any, index: number) => {
    return sizes.map((size, idx) =>
      idx === index ? (params ? "0%" : "15%") : size
    );
  };



  const toggleBottomPane = () => {
    setIsDisplayPane((prev: any) => ({ ...prev, bottom: !prev.bottom }));
  };

  const toggleRightPane = () => {
    const isVisible = isDisplayPane.right;
    setIsDisplayPane((prev: any) => ({ ...prev, right: !isVisible }));
    setSizes((prev) => [prev[0], isVisible ? "0%" : "25%"]);
  };

  return (
    <div className='select-none flex flex-col h-screen overflow-hidden'>
      <div className='flex flex-grow overflow-hidden w-full h-full'>
        <SplitPane
          split='vertical'
          sashRender={() => <SashContent type='vscode' />}
          sizes={sizes}
          onChange={setSizes}>
          <Pane>
            <div className='flex items-center justify-center h-full relative'>
              <NSTabs
                tabs={tabs}
                onAdd={handleAddTab}
                onClose={handleCloseTab}
                onRename={handleRenameTab}
                integratedTitlebar={false}
                extraLeftContent={<HeaderLeft />}
                extraRightContent={
                  <HeaderRight
                    toggleBottomPane={toggleBottomPane}
                    toggleRightPane={toggleRightPane}
                  />
                }
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
    <Content />
  );
};

export default App;