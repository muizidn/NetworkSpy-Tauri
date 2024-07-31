import { useState, ReactNode } from "react";

export interface Tab {
  id: string;
  title: string;
  content: ReactNode;
  icon?: ReactNode;
}

interface TabPanelProps {
  tag: string;
  current: string;
  children: ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({ tag, current, children }) => {
  return (
    <div
      className='absolute w-full h-full overflow-auto'
      hidden={current !== tag}>
      {children}
    </div>
  );
};

interface CertificateHelpProps {
  title?: string;
  tabs: Tab[];
  initialTab?: string;
}

export const CertificateHelp: React.FC<CertificateHelpProps> = ({
  title,
  tabs,
  initialTab,
}) => {
  const [currentTab, setCurrentTab] = useState(initialTab || tabs[0].id);

  return (
    <div className='flex h-full bg-[#23262a] text-white w-full relative'>
      <div className='w-1/5 flex flex-col overflow-y-auto no-scrollbar bg-[#23262a] z-10 p-4'>
        <input
          type='text'
          className='input input-xs rounded bg-[#474b49] w-full mb-2 h-8'
          placeholder='Search'
        />
        {title && <h3 className='p-2 text-sm flex items-center'>{title}</h3>}
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`h-8 mb-1 flex items-center px-2 py-2 text-xs text-nowrap text-left rounded ${
              currentTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-[#23262a] text-gray-200"
            }`}
            onClick={() => setCurrentTab(tab.id)}>
            {tab.icon}
            {tab.title}
          </button>
        ))}
      </div>
      <div className='relative w-full h-full'>
        {tabs.map((tab) => (
          <TabPanel key={tab.id} current={currentTab} tag={tab.id}>
            {tab.content}
          </TabPanel>
        ))}
      </div>
    </div>
  );
};
