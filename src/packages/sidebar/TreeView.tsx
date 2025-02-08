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

  const data = flattenTree({
    name: "----",
    children: childrenNodes
  })
  return (
    <div className="bg-[#23262a] w-full flex flex-col items-start">
      <button
        onClick={() => setIsShown(!isShown)}
        className="flex justify-between hover:bg-gray-700 rounded-md w-full p-1 items-center"
      >
        <div className="flex space-x-2 items-center">
          {icon}
          <label className="font-bold text-white cursor-pointer text-lg">
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
                style={{ paddingLeft: 20 * (level - 1) }}
                className="flex space-x-2 hover:bg-gray-700 rounded-md w-full p-1 items-center"
              >
                {isBranch ? (
                  <ArrowIcon isOpen={isExpanded} />
                ) : (
                  <FolderIcon filename={element.name} />
                )}
                <button className="pl-1" onClick={() => onClick(element.id.toString())}>
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
