import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { twMerge } from 'tailwind-merge';
import { FiActivity, FiX } from "react-icons/fi";

interface TabProps {
  id: string;
  title: string;
  index: number;
  currentTab: string;
  onClose?: (id: string) => void;
  allowClose?: boolean;
  onRename?: (id: string, newTitle: string) => void;
  setCurrentTab: (id: string) => void;
  moveTab: (dragIndex: number, hoverIndex: number) => void;
  designStyle?: "chrome" | "opera" | "basic";
}

const Tab: React.FC<TabProps> = ({ id, title, index, currentTab, onClose, allowClose, onRename, setCurrentTab, moveTab, designStyle = "chrome" }) => {
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
        "flex group items-center justify-between cursor-default transition-all relative shrink-0",
        // Chrome
        designStyle === "chrome" && "rounded-t-[10px] pl-3 pr-2 min-w-[140px] max-w-[240px] h-[32px] -mb-px flex-1",
        designStyle === "chrome" && currentTab === id && "bg-[#23262a] text-zinc-100 z-20 border-t border-x border-[#333] border-b border-b-[#23262a]",
        designStyle === "chrome" && currentTab !== id && "bg-transparent text-zinc-400 hover:bg-[#23262a]/40 hover:text-zinc-200 border border-transparent z-10 pb-px",

        // Opera
        designStyle === "opera" && "rounded-md px-2 min-w-[120px] max-w-[200px] h-[28px] mx-0.5 my-0 flex-1",
        designStyle === "opera" && currentTab === id && "bg-[#33363a] text-zinc-100 z-20 shadow-md border border-zinc-700/50",
        designStyle === "opera" && currentTab !== id && "bg-transparent text-zinc-500 hover:bg-[#23262a] hover:text-zinc-300 border border-transparent z-10",

        // Basic
        designStyle === "basic" && "px-3 min-w-0 max-w-[160px] h-[28px] -mb-[1px] border-b-2 flex-1",
        designStyle === "basic" && currentTab === id && "border-blue-500 text-blue-400 bg-transparent z-20",
        designStyle === "basic" && currentTab !== id && "border-transparent text-zinc-500 hover:text-zinc-300 z-10",

        isDragging && "opacity-0"
      )}
    >
      {/* Right separator for inactive tabs (Chrome only) */}
      {designStyle === "chrome" && currentTab !== id && (
        <div className="absolute right-[-1px] top-[20%] h-[60%] w-[1px] bg-zinc-700/50 group-hover:opacity-0 transition-opacity z-0 pointer-events-none" />
      )}

      {isEditing ? (
        <input
          autoFocus
          className="bg-transparent text-[11px] px-0 py-1 outline-none w-full flex-1 min-w-0"
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
          className={twMerge(
            "flex items-center space-x-2 flex-1 min-w-0 h-full text-left cursor-default outline-none",
            designStyle === "basic" ? "py-0 justify-center" : "py-1"
          )}
          onClick={(e) => {
            e.preventDefault();
            setCurrentTab(id);
          }}
        >
          {designStyle !== "basic" && (
            <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <FiActivity size={10} />
            </div>
          )}
          <span
            className={twMerge(
              "font-medium whitespace-nowrap truncate flex-1 min-w-0",
              designStyle === "basic" ? "text-xs text-center" : "text-[11px]"
            )}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditValue(title);
              setIsEditing(true);
            }}
          >
            {title}
          </span>
        </button>
      )}

      {allowClose && onClose && !isEditing && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTabClose(id);
          }}
          className={twMerge(
            "flex items-center justify-center w-5 h-5 rounded-full hover:bg-zinc-600/50 transition-colors shrink-0 ml-1 cursor-pointer",
            currentTab === id ? "opacity-100 text-zinc-300" : "opacity-0 group-hover:opacity-100 text-zinc-400"
          )}
          title="Close tab"
        >
          <FiX size={12} />
        </button>
      )}
    </div>
  );
};

export default Tab;
