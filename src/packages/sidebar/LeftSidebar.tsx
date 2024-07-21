import { SidebarTreeView, TreeNode } from "./TreeView";

const pinned: TreeNode = {
  name: "Pin",
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

const saved: TreeNode = {
  name: "Saved",
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

const app: TreeNode = {
  name: "App",
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

const domain: TreeNode = {
  name: "Domain",
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

export const LeftSidebar = () => {
  async function onClickNode(name: string) {}
  const favoriteTrees = [pinned, saved];
  const allTrees = [app, domain];

  return (
    <div className="bg-[#23262a] border-r border-black h-full w-full flex flex-col space-y-4">
      <div className="p-2 flex flex-col space-y-4 h-full w-full  items-start overflow-scroll">
        <div className="flex flex-col space-y-2 items-start w-full">
          <h2 className="font-bold text-lg text-white">Favorites</h2>
          {favoriteTrees.map((e) => (
            <SidebarTreeView
              key={e.name}
              node={e}
              onClick={(name) => onClickNode(name)}
            />
          ))}
        </div>
        <div className="flex flex-col space-y-2 items-start w-full">
          <h2 className="font-bold text-lg text-white">All</h2>
          {allTrees.map((e) => (
            <SidebarTreeView
              key={e.name}
              node={e}
              onClick={(name) => onClickNode(name)}
            />
          ))}
        </div>
      </div>
      <div className="p-2 flex space-x-2 w-full border-t border-black">
        <button className="btn btn-xs bg-[#474b49] rounded text-white">
          +
        </button>
        <input
          type="text"
          className="input input-xs flex-grow rounded bg-[#474b49] w-full"
          placeholder="Search"
        />
      </div>
    </div>
  );
};
