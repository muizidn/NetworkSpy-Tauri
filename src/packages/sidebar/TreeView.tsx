import React, { useCallback, useMemo, useState } from "react";
import TreeView, { flattenTree } from "react-accessible-treeview";
import { ArrowDown2, ArrowRight2, Document } from "iconsax-react";

interface ArrowIconProps {
  isOpen: boolean;
}

interface FolderIconProps {
  filename: string;
}

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

export function filterNode(query: string, node: TreeNode, onFindNode: () => void): TreeNode | null {
  // Filter the children recursively
  let filteredChildren: TreeNode[] | undefined;

  if (node.children) {
    // Filter each child node and remove null results
    filteredChildren = node.children
      .map((child) => filterNode(query, child, onFindNode))
      .filter((child) => child !== null) as TreeNode[];
  }

  // If we have filtered children and their length > 0, return the node with the filtered children
  if (filteredChildren && filteredChildren.length > 0) {
    return { ...node, children: filteredChildren };
  }

  // If node doesn't have children or if no matching children, check if the node itself matches the query
  if (node.name.includes(query)) {
    onFindNode()
    return { ...node, children: filteredChildren }; // Even if no children match, return the node if it matches
  }

  return null; // Return null if neither the node nor its children match
}

interface SidebarTreeViewProps {
  name: string;
  icon?: React.ReactNode;
  childrenNodes?: TreeNode[];
  onClick: (id: string) => void;
}

export const SidebarTreeView: React.FC<SidebarTreeViewProps> = ({
  name,
  icon,
  childrenNodes,
  onClick,
}) => {
  const [isShown, setIsShown] = useState(true);

  const data = useMemo(() => flattenTree({
    name: "----",
    id: "root",
    children: childrenNodes || []
  }), [childrenNodes]);

  if (!childrenNodes || childrenNodes.length === 0) {
    return (
      <div className="w-full flex flex-col items-start opacity-40">
        <div className="flex justify-between w-full p-1 items-center">
          <div className="flex space-x-2 items-center">
            {icon}
            <label className="font-bold text-zinc-500 text-xs uppercase tracking-tight">
              {name}
            </label>
          </div>
          <span className="text-[10px] text-zinc-600 italic px-2">Empty</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-start transition-all duration-300">
      <button
        onClick={() => setIsShown(!isShown)}
        className="flex justify-between hover:bg-white/5 rounded-md w-full p-1 items-center group transition-colors"
      >
        <div className="flex space-x-2 items-center">
          <div className="text-zinc-400 group-hover:text-blue-400 transition-colors">
             {icon}
          </div>
          <label className="font-bold text-zinc-200 cursor-pointer text-xs uppercase tracking-tight">
            {name}
          </label>
        </div>
        <ArrowIcon isOpen={isShown} />
      </button>
      {isShown && (
        <div className="pl-2 directory w-full">
          <TreeView
            data={data}
            aria-label="directory tree"
            nodeRenderer={({
              element,
              isBranch,
              isExpanded,
              getNodeProps,
              level,
            }) => (
              <div
                {...getNodeProps()}
                style={{ paddingLeft: 12 * (level - 1) }}
                className="flex space-x-2 hover:bg-white/5 rounded-md w-full py-0.5 px-2 items-center group cursor-pointer"
              >
                <div className="shrink-0">
                  {isBranch ? (
                    <ArrowIcon isOpen={isExpanded} />
                  ) : (
                    <FolderIcon filename={element.name} />
                  )}
                </div>
                <span 
                  className="text-[11px] text-zinc-300 truncate group-hover:text-zinc-100" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(element.id.toString());
                  }}
                >
                  {element.name}
                </span>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
};

const ArrowIcon: React.FC<ArrowIconProps> = ({ isOpen }) =>
  isOpen ? (
    <ArrowDown2 color="currentColor" size={14} className="opacity-60" />
  ) : (
    <ArrowRight2 color="currentColor" size={14} className="opacity-60" />
  );

const FolderIcon: React.FC<FolderIconProps> = ({ filename }) => {
  return <Document size={14} className="text-blue-500/60" />;
};
