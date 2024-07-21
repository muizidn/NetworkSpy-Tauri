import React, { useState } from "react";
import TreeView, { flattenTree } from "react-accessible-treeview";
import { ArrowDown2, ArrowRight2, Document } from "iconsax-react";

interface ArrowIconProps {
  isOpen: boolean;
}

interface FolderIconProps {
  filename: string;
}

export interface TreeNode {
  name: string;
  children?: TreeNode[];
}

export function filterNode(query: string, node: TreeNode): TreeNode | null {
  let filteredChildren: TreeNode[] | undefined;

  if (node.children) {
    filteredChildren = node.children
      .map((child) => filterNode(query, child))
      .filter((child) => child !== null) as TreeNode[];
  }

  if (filteredChildren && filteredChildren.length > 0) {
    return { ...node, children: filteredChildren };
  }

  if (node.name.includes(query)) {
    return { ...node, children: filteredChildren };
  }

  return null;
}

interface SidebarTreeViewProps {
  node: TreeNode;
  onClick: (name: string) => void;
}

export const SidebarTreeView: React.FC<SidebarTreeViewProps> = ({
  node,
  onClick,
}) => {
  const [isShown, setIsShown] = useState(true);

  const data = flattenTree(node);
  return (
    <div className="bg-[#23262a] w-full flex flex-col items-start">
      <button
        onClick={() => setIsShown(!isShown)}
        className="flex space-x-2 hover:bg-gray-700 rounded-md w-full p-1 items-center"
      >
        <ArrowIcon isOpen={isShown} />
        <label className="font-bold text-white cursor-pointer">
          {node.name}
        </label>
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
                style={{ paddingLeft: 20 * (level - 1) }}
                className="flex space-x-2 hover:bg-gray-700 rounded-md w-full p-1 items-center"
              >
                {isBranch ? (
                  <ArrowIcon isOpen={isExpanded} />
                ) : (
                  <FolderIcon filename={element.name} />
                )}
                <button className="pl-1" onClick={() => onClick(element.name)}>
                  {element.name}
                </button>
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
    <ArrowDown2 color="#fff" size={20} className="ml-2" />
  ) : (
    <ArrowRight2 color="#fff" size={20} className="ml-2" />
  );

const FolderIcon: React.FC<FolderIconProps> = ({ filename }) => {
  const extension = filename.slice(filename.lastIndexOf(".") + 1);
  switch (extension) {
    default:
      return <Document size={20} className="ml-2" />;
  }
};
