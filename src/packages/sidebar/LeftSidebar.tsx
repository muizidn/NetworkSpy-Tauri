import React from "react";
import TreeView, { flattenTree } from "react-accessible-treeview";
import { ArrowDown2, ArrowRight2, Document } from "iconsax-react";

interface ArrowIconProps {
  isOpen: boolean;
}

interface FolderIconProps {
  filename: string;
}

const path = {
  name: "",
  children: [
    {
      name: "src",
      children: [{ name: "index.js" }, { name: "styles.css" }],
    },
    {
      name: "node_modules",
      children: [
        {
          name: "treeview",
          children: [{ name: "index.js" }],
        },
        { name: "react", children: [{ name: "index.js" }] },
      ],
    },
    {
      name: ".npmignore",
    },
    {
      name: "package.json",
    },
    {
      name: "webpack.config.js",
    },
  ],
};

const data = flattenTree(path);

export const LeftSidebar = () => {
  return (
    <div className='bg-[#23262a] p-2 border-x border-b border-black h-full w-full'>
      <DirectoryTreeView />
    </div>
  );
};

function DirectoryTreeView() {
  return (
    <div>
      <div className='directory'>
        <TreeView
          data={data}
          aria-label='directory tree'
          nodeRenderer={({
            element,
            isBranch,
            isExpanded,
            getNodeProps,
            level,
          }) => (
            <div {...getNodeProps()} style={{ paddingLeft: 20 * (level - 1) }}>
              {isBranch ? (
                <ArrowIcon isOpen={isExpanded} />
              ) : (
                <FolderIcon filename={element.name} />
              )}
              <p className='pl-1'>{element.name}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}

const ArrowIcon: React.FC<ArrowIconProps> = ({ isOpen }) =>
  isOpen ? (
    <ArrowDown2 color='#fff' size={20} className='ml-2' />
  ) : (
    <ArrowRight2 color='#fff' size={20} className='ml-2' />
  );

const FolderIcon: React.FC<FolderIconProps> = ({ filename }) => {
  const extension = filename.slice(filename.lastIndexOf(".") + 1);
  switch (extension) {
    default:
      return <Document size={20} className='ml-2' />;
  }
};
