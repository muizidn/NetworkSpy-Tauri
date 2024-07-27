import { useEffect, useState } from "react";
import { filterNode, SidebarTreeView, TreeNode } from "./TreeView";
import { twMerge } from "tailwind-merge";

const kPINNED: TreeNode = {
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

const kSAVED: TreeNode = {
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

const kAPP: TreeNode = {
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

const kDOMAIN: TreeNode = {
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

  const [query, setQuery] = useState("");
  const [pinned, setPinned] = useState(kPINNED);
  const [saved, setSaved] = useState(kSAVED);
  const [app, setApp] = useState(kAPP);
  const [domain, setDomain] = useState(kDOMAIN);
  const [filteredNodes, setFilteredNodes] = useState<TreeNode[]>([]);

  function flatMapNode(e: TreeNode): TreeNode[] {
    const selfWithoutChildren = { ...e, children: undefined } as TreeNode;
    if (e.children) {
      const flatmapped = e.children.flatMap((e) => flatMapNode(e));
      return Array.from([selfWithoutChildren].concat(flatmapped));
    }
    return [selfWithoutChildren];
  }

  async function filterNodes(query: string) {
    setQuery(query);
    const trees = [pinned, saved, app, domain];
    const filtered = trees
      .map((e) => filterNode(query, e))
      .filter((e) => e !== null);
    const flatMapped = filtered.flatMap((e) => flatMapNode(e));
    setFilteredNodes(flatMapped);
  }

  const favoriteTrees = [pinned, saved];
  const allTrees = [app, domain];

  return (
    <div className="bg-[#23262a] border-r border-black h-full w-full flex flex-col space-y-4">
      <div className="flex items-end space-x-2 w-full px-2 h-8">
        <button className="btn btn-xs bg-[#474b49] rounded text-white">
          +
        </button>
        <input
          type="text"
          className="input input-xs flex-grow rounded bg-[#474b49] w-full"
          placeholder="Search"
          value={query}
          onChange={(e) => filterNodes(e.target.value)}
        />
      </div>
      <div
        className={twMerge(
          "p-2 flex flex-col space-y-4 h-full w-full  items-start overflow-scroll",
          query !== "" && "hidden"
        )}
      >
        <div className={twMerge("flex flex-col space-y-2 items-start w-full")}>
          <h2 className="font-bold text-lg text-white">Favorites</h2>
          {favoriteTrees.map((e) => (
            <SidebarTreeView
              key={e.name}
              node={e}
              onClick={(name) => onClickNode(name)}
            />
          ))}
        </div>
        <div className={twMerge("flex flex-col space-y-2 items-start w-full")}>
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
      <div
        className={twMerge(
          "flex flex-col space-y-2 items-start w-full max-h-full",
          query === "" && "hidden"
        )}
      >
        <h2 className="font-bold text-lg text-white">
          Filter Result: ({filteredNodes.length}) result
        </h2>
        <div className="overflow-scroll w-full">
          <SidebarTreeView
            node={{ name: "Filtered", children: filteredNodes }}
            onClick={(name) => onClickNode(name)}
          />
        </div>
      </div>
    </div>
  );
};
