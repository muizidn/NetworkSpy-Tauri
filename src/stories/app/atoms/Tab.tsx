import { Icon } from '@src/packages/ui/Icon';
import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { twMerge } from 'tailwind-merge';

interface TabProps {
  id: string;
  title: string;
  index: number;
  currentTab: string;
  onClose?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  setCurrentTab: (id: string) => void;
  moveTab: (dragIndex: number, hoverIndex: number) => void;
}

const Tab: React.FC<TabProps> = ({ id, title, index, currentTab, onClose, onRename, setCurrentTab, moveTab }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(title);
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'TAB',
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'TAB',
    hover: (item: { id: string; index: number }, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientX = (clientOffset?.x || 0) - hoverBoundingRect.left;

      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;

      moveTab(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

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
      ref={ref}
      key={id}
      className={twMerge(
        "flex group space-x-1 rounded-t border border-black px-1 cursor-pointer transition-all",
        currentTab === id ? "bg-white text-black" : "bg-[#1e1e1e] mt-1 text-zinc-400 hover:text-white",
        isDragging && "opacity-0"
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
