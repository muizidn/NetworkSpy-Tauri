import { useState, ReactNode, useMemo, useCallback } from "react";
import { Icon } from "./Icon";

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
  initialTab?: string;
}

export const NSTabs: React.FC<NSTabsProps> = ({
  title,
  tabs,
  initialTab,
  onClose,
}) => {
  const [currentTab, setCurrentTab] = useState(initialTab || (tabs[0]?.id || ''));

  // Memoize tabs to avoid unnecessary re-renders
  const memoizedTabs = useMemo(() => tabs, [tabs]);

  const handleTabClose = useCallback((tabId: string) => {
    if (onClose) {
      onClose(tabId);
    }

    const tabIndex = memoizedTabs.findIndex(tab => tab.id === tabId);

    if (tabIndex === -1) return; // Tab not found

    const previousTab = memoizedTabs[tabIndex - 1]?.id;
    const nextTab = memoizedTabs[tabIndex + 1]?.id;

    if (nextTab) {
      setCurrentTab(nextTab);
    } else if (previousTab) {
      setCurrentTab(previousTab);
    } else {
      setCurrentTab(memoizedTabs[0]?.id || '');
    }
  }, [memoizedTabs, onClose]);

  return (
    <div className="flex flex-col h-full bg-[#23262a] text-white w-full relative">
      <div className="sticky top-0 flex overflow-x-auto no-scrollbar bg-[#23262a] z-10 h-8">
        {title && <h3 className="p-2 text-sm flex items-center">{title}</h3>}
        {memoizedTabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex group space-x-1 rounded-t border border-black px-1 ${
              currentTab === tab.id
                ? "bg-white text-black"
                : "bg-[#1e1e1e] mt-1"
            }`}
          >
            <button
              className="px-2 py-1 text-xs text-nowrap"
              onClick={() => setCurrentTab(tab.id)}
            >
              {tab.title}
            </button>
            {onClose && (
              <button onClick={() => handleTabClose(tab.id)}>
                <Icon iconName="Close" />
              </button>
            )}
          </div>
        ))}
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
