import { useState, ReactNode } from "react";

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
  initialTab?: string;
}

export const NSTabs: React.FC<NSTabsProps> = ({ title,tabs, initialTab }) => {
  const [currentTab, setCurrentTab] = useState(initialTab || tabs[0].id);

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white border w-full">
      <div className="flex space-x-2">
        {title && <h3 className="p-2">{title}</h3>}
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setCurrentTab(tab.id)}>
            {tab.title}
          </button>
        ))}
      </div>
      <div className="relative w-full h-full">
        {tabs.map((tab) => (
          <TabPanel key={tab.id} current={currentTab} tag={tab.id}>
            {tab.content}
          </TabPanel>
        ))}
      </div>
    </div>
  );
};