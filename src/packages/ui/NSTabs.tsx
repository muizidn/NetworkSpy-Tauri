import { useState, ReactNode, useMemo, useCallback, useEffect, useRef } from "react";
import { Icon } from "./Icon";
import { twMerge } from "tailwind-merge";
import Tab from "@src/stories/app/atoms/Tab";

export interface Tab {
  id: string;
  title: string;
  content: ReactNode;
}

interface TabPanelProps {
  tag: string;
  current: string;
  children: ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({ tag, current, children }) => {
  return (
    <div className="absolute w-full h-full" hidden={current !== tag}>
      {children}
    </div>
  );
};

interface NSTabsProps {
  title?: string;
  tabs: Tab[];
  onClose?: (id: string) => void;
  onAdd?: () => void;
  onRename?: (id: string, newTitle: string) => void;
  initialTab?: string;
}

import { FiPlus } from "react-icons/fi";

export const NSTabs: React.FC<NSTabsProps> = ({
  title,
  tabs,
  initialTab,
  onClose,
  onAdd,
  onRename,
}) => {
  const [currentTab, setCurrentTab] = useState(initialTab || tabs[0]?.id || "");
  const prevTabsLength = useRef(tabs.length);

  useEffect(() => {
    // If a tab was added, switch to it
    if (tabs.length > prevTabsLength.current) {
      const lastTab = tabs[tabs.length - 1];
      if (lastTab) {
        setCurrentTab(lastTab.id);
      }
    }
    prevTabsLength.current = tabs.length;
  }, [tabs]);

  // Memoize tabs to avoid unnecessary re-renders
  const memoizedTabs = useMemo(() => tabs, [tabs]);

  const handleTabClose = useCallback(
    (tabId: string) => {
      if (onClose) {
        onClose(tabId);
      }

      const tabIndex = memoizedTabs.findIndex((tab) => tab.id === tabId);

      if (tabIndex === -1) return; // Tab not found

      const previousTab = memoizedTabs[tabIndex - 1]?.id;
      const nextTab = memoizedTabs[tabIndex + 1]?.id;

      if (nextTab) {
        setCurrentTab(nextTab);
      } else if (previousTab) {
        setCurrentTab(previousTab);
      } else {
        setCurrentTab(memoizedTabs[0]?.id || "");
      }
    },
    [memoizedTabs, onClose]
  );

  return (
    <div
      id={`tabs-for-${title}`}
      className="flex flex-col h-full bg-[#23262a] text-white w-full relative overflow-hidden"
    >
      <div className="flex overflow-x-auto no-scrollbar bg-[#23262a] z-10 h-9 border-b border-black shrink-0 relative">
        {title && <h3 className="px-3 text-xs flex items-center shrink-0 uppercase tracking-wider text-zinc-500 font-bold">{title}</h3>}
        {memoizedTabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            title={tab.title}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            onClose={handleTabClose}
            onRename={onRename}
          />
        ))}
        {onAdd && (
          <button
            onClick={onAdd}
            className="sticky right-0 flex items-center justify-center px-3 bg-[#23262a] hover:bg-[#2a2d32] transition-colors border-l border-black text-zinc-400 hover:text-white z-20 shadow-[-4px_0_8px_rgba(0,0,0,0.3)]"
            title="Open new tab"
          >
            <FiPlus size={14} />
          </button>
        )}
      </div>
      <div className="relative w-full h-full">
        {memoizedTabs.map((tab) => (
          <TabPanel key={tab.id} current={currentTab} tag={tab.id}>
            {tab.content}
          </TabPanel>
        ))}
      </div>
    </div>
  );
};
