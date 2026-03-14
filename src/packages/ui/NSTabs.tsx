import { useState, ReactNode, useMemo, useCallback, useEffect, useRef, Suspense } from "react";
import { Icon } from "./Icon";
import { twMerge } from "tailwind-merge";
import Tab from "@src/stories/app/atoms/Tab";
import { ErrorBoundary } from "./ErrorBoundary";

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
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-zinc-600 italic text-xs animate-pulse bg-[#1a1c1e]">
            Loading...
          </div>
        }>
          {children}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

interface NSTabsProps {
  title?: ReactNode;
  tabs: Tab[];
  onClose?: (id: string) => void;
  onAdd?: () => void;
  onRename?: (id: string, newTitle: string) => void;
  onReorder?: (dragIndex: number, hoverIndex: number) => void;
  initialTab?: string;
  designStyle?: "chrome" | "opera" | "basic";
  extraRightContent?: ReactNode;
  extraLeftContent?: ReactNode;
  integratedTitlebar?: boolean;
}

import { FiPlus } from "react-icons/fi";

export const NSTabs: React.FC<NSTabsProps> = ({
  title,
  tabs,
  initialTab,
  onClose,
  onAdd,
  onRename,
  onReorder,
  designStyle = "chrome",
  extraRightContent,
  extraLeftContent,
  integratedTitlebar = false,
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
    } else if (tabs.length > 0 && !tabs.find(t => t.id === currentTab)) {
      // If the current tab was removed or invalid, switch to the first tab
      setCurrentTab(tabs[0].id);
    }
    prevTabsLength.current = tabs.length;
  }, [tabs, currentTab]);

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
      <div
        data-tauri-drag-region={integratedTitlebar ? "" : undefined}
        className={twMerge(
          "flex flex-nowrap z-10 shrink-0 relative items-end overflow-y-hidden h-10",
          designStyle === "chrome" && "bg-[#0a0a0a] pt-1.5 px-2",
          designStyle === "opera" && "bg-[#181a1f] pt-1 px-1 border-b border-black",
          designStyle === "basic" && "bg-transparent border-b border-zinc-800/80 px-1 h-7",
          integratedTitlebar && "pl-20"
        )}
      >
        {designStyle === "chrome" && <div className="absolute bottom-0 left-0 right-0 h-px bg-[#333] z-0" />}

        {/* Fixed Left Section */}
        <div className="flex items-center shrink-0 z-20 h-full">
          {extraLeftContent && (
            <div className="flex items-center">
              {extraLeftContent}
            </div>
          )}
          {title && (
            <div className="px-3 text-xs flex items-center uppercase tracking-wider text-zinc-500 font-bold">
              {title}
            </div>
          )}
        </div>

        {/* Scrollable Tabs Section */}
        <div className="flex-1 flex flex-nowrap overflow-x-auto no-scrollbar items-end h-full relative">
          {memoizedTabs.map((tab, index) => (
            <Tab
              key={tab.id}
              id={tab.id}
              index={index}
              title={tab.title}
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              onClose={handleTabClose}
              allowClose={designStyle !== "basic"}
              onRename={onRename}
              moveTab={(dragIndex, hoverIndex) => onReorder?.(dragIndex, hoverIndex)}
              designStyle={designStyle}
            />
          ))}
          {onAdd && (
            <div className="flex justify-end sticky right-0 z-20 shrink-0">
              <button
                onClick={onAdd}
                className="flex items-center justify-center h-[28px] w-8 mb-[2px] bg-[#23262a] hover:bg-white/10 transition-colors text-zinc-400 hover:text-white rounded-md mx-1"
                title="Open new tab"
              >
                <FiPlus size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Fixed Right Section */}
        {extraRightContent && (
          <div className="flex items-center shrink-0 z-20 h-full pb-1.5 px-2">
            {extraRightContent}
          </div>
        )}
      </div>
      <div className="relative w-full h-full bg-[#23262a] z-0">
        {memoizedTabs.map((tab) => (
          <TabPanel key={tab.id} current={currentTab} tag={tab.id}>
            {tab.content}
          </TabPanel>
        ))}
      </div>
    </div>
  );
};
