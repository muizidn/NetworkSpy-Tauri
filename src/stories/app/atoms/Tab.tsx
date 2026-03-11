import { Icon } from '@src/packages/ui/Icon';
import React from 'react';
import { twMerge } from 'tailwind-merge';

interface TabProps {
  id: string;
  title: string;
  currentTab: string;
  onClose?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  setCurrentTab: (id: string) => void;
}

const Tab: React.FC<TabProps> = ({ id, title, currentTab, onClose, onRename, setCurrentTab }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(title);

  const handleTabClose = (tabId: string) => {
    if (onClose) {
      onClose(tabId);
    }
  };

  const handleRename = () => {
    if (onRename && editValue.trim() && editValue !== title) {
      onRename(id, editValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      key={id}
      className={twMerge(
        "flex group space-x-1 rounded-t border border-black px-1",
        currentTab === id ? "bg-white text-black" : "bg-[#1e1e1e] mt-1"
      )}
    >
      {isEditing ? (
        <input
          autoFocus
          className="bg-transparent text-xs px-2 py-1 outline-none w-32"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") {
              setEditValue(title);
              setIsEditing(false);
            }
          }}
        />
      ) : (
        <button
          className="px-2 py-1 text-xs whitespace-nowrap min-w-[40px] text-left"
          onClick={() => setCurrentTab(id)}
          onDoubleClick={() => {
            setEditValue(title);
            setIsEditing(true);
          }}
        >
          {title}
        </button>
      )}
      {onClose && !isEditing && (
        <button
          onClick={() => handleTabClose(id)}
          className="hidden group-hover:block opacity-60 hover:opacity-100 transition-opacity"
        >
          <Icon iconName="Close" />
        </button>
      )}
    </div>
  );
};

export default Tab;
