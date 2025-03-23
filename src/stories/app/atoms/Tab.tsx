import { Icon } from '@src/packages/ui/Icon';
import React from 'react';
import { twMerge } from 'tailwind-merge';

interface TabProps {
  id: string;
  title: string;
  currentTab: string;
  onClose?: (id: string) => void;
  setCurrentTab: (id: string) => void;
}

const Tab: React.FC<TabProps> = ({ id, title, currentTab, onClose, setCurrentTab }) => {
  const handleTabClose = (tabId: string) => {
    if (onClose) {
      onClose(tabId);
    }
  };

  return (
    <div
      key={id}
      className={twMerge(
        "flex group space-x-1 rounded-t border border-black px-1",
        currentTab === id ? "bg-white text-black" : "bg-[#1e1e1e] mt-1"
      )}
    >
      <button
        className="px-2 py-1 text-xs whitespace-nowrap"
        onClick={() => setCurrentTab(id)}
      >
        {title}
      </button>
      {onClose && (
        <button onClick={() => handleTabClose(id)}>
          <Icon iconName="Close" />
        </button>
      )}
    </div>
  );
};

export default Tab;
