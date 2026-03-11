import { useEffect, useMemo, useState } from "react";
import { BsPinAngleFill } from "react-icons/bs";
import { GrStorage } from "react-icons/gr";
import { LuAppWindow } from "react-icons/lu";
import { GoGlobe, GoSearch } from "react-icons/go";
import { VscListFlat, VscListTree } from "react-icons/vsc";
import { FiStar, FiLayers } from "react-icons/fi";

import { filterNode, SidebarTreeView, TreeNode } from "./TreeView";
import { twMerge } from "tailwind-merge";
import { useTrafficListContext } from "../main-content/context/TrafficList";
import {
  groupUrlsInTree,
  kTreeNodeIdPrefixSeparator,
} from "./parseUrlToTreeNode";

type FilterDisplayMode = "tree" | "flat";

export const LeftSidebar = () => {
  const { trafficList } = useTrafficListContext();

  const [query, setQuery] = useState("");
  const [filterDisplayMode, setFilterDisplayMode] =
    useState<FilterDisplayMode>("flat");
  const [filteredNodes, setFilteredNodes] = useState<
    {
      name: string;
      icon: React.ReactNode;
      nodes: TreeNode[];
    }[]
  >([]);

  const [filteredNodesCount, setFilteredNodesCount] = useState(0);

  const groupedTraffic = useMemo(() => {
    const urls = trafficList.filter((t: any) => t.url).map((t: any) => t.url as string);
    return {
      app: urls,
      domain: urls,
      pinned: urls,
      saved: urls,
    };
  }, [trafficList]);

  const app = useMemo(() => {
    return {
      name: "App",
      icon: <LuAppWindow />,
      nodes: groupUrlsInTree("app", groupedTraffic.app),
    };
  }, [groupedTraffic]);

  const domain = useMemo(() => {
    return {
      name: "Domain",
      icon: <GoGlobe />,
      nodes: groupUrlsInTree("domain", groupedTraffic.domain),
    };
  }, [groupedTraffic]);

  const pinned = useMemo(() => {
    return {
      name: "Pinned",
      icon: <BsPinAngleFill />,
      nodes: groupUrlsInTree("pinned", groupedTraffic.pinned),
    };
  }, [groupedTraffic]);

  const saved = useMemo(() => {
    return {
      name: "Saved",
      icon: <GrStorage />,
      nodes: groupUrlsInTree("saved", groupedTraffic.saved),
    };
  }, [groupedTraffic]);

  async function onClickNode(id: string) {
    const uuidAndUrl = id.split(kTreeNodeIdPrefixSeparator);
    const url = uuidAndUrl[1];
    console.log("Selected URL from sidebar:", url);
    // TODO: Implement a way to communicate with the active tab's FilterContext if needed
  }

  function flatMapNode(e: TreeNode | null, path: string = ""): TreeNode[] {
    if (!e) {
      return [];
    }

    const currentPath = path ? `${path}/${e.name}` : e.name;

    const selfWithoutChildren = {
      ...e,
      name: currentPath,
      children: undefined,
    } as TreeNode;

    if (e.children && e.children.length > 0) {
      const flatmappedChildren = e.children.flatMap((child) =>
        flatMapNode(child, currentPath)
      );
      return [selfWithoutChildren, ...flatmappedChildren];
    }

    return [selfWithoutChildren];
  }

  async function filterNodes(query: string) {
    let nodeFound = 0;

    const trees = [pinned, saved, app, domain];
    const filtered = trees.map((tree) => ({
      ...tree,
      nodes: tree.nodes
        .map((e) => filterNode(query, e, () => (nodeFound += 1)))
        .filter((e) => e !== null),
    }));
    setFilteredNodesCount(nodeFound);
    switch (filterDisplayMode) {
      case "tree":
        //@ts-ignore
        setFilteredNodes(filtered);
        break;
      case "flat":
        const flatMapped = filtered
          .flatMap((e) => e.nodes)
          .flatMap((e) => flatMapNode(e));
        setFilteredNodes([
          {
            name: "Flattened",
            icon: <VscListFlat />,
            nodes: flatMapped,
          },
        ]);
        break;
    }
  }

  useEffect(() => {
    filterNodes(query);
  }, [filterDisplayMode, query]);

  const favoriteTrees = [pinned, saved];
  const allTrees = [app, domain];

  return (
    <div className="bg-[#23262a] border-r border-black h-full w-full flex flex-col space-y-4">
      <div className="flex items-center space-x-2 w-full px-3 h-10 border-b border-black bg-black/20 shrink-0">
        <GoSearch className="text-zinc-500 shrink-0" size={14} />
        <input
          type="text"
          className="bg-transparent text-xs text-white focus:outline-none w-full placeholder:text-zinc-600"
          placeholder="Search endpoints..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div
        className={twMerge(
          "p-2 flex flex-col space-y-4 h-full w-full  items-start overflow-scroll",
          query !== "" && "hidden"
        )}
      >
        <div className="flex flex-col space-y-3 items-start w-full">
          <div className="flex items-center space-x-2 px-1 shrink-0">
            <FiStar className="text-amber-400" size={14} />
            <h2 className="font-bold text-xs uppercase tracking-widest text-zinc-400">Favorites</h2>
          </div>
          <div className="w-full space-y-1">
            {favoriteTrees.map((e) => (
              <SidebarTreeView
                key={e.name}
                name={e.name}
                icon={e.icon}
                childrenNodes={e.nodes}
                onClick={(id) => onClickNode(id)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col space-y-3 items-start w-full pt-4 border-t border-black/30">
          <div className="flex items-center space-x-2 px-1 shrink-0">
            <FiLayers className="text-zinc-500" size={14} />
            <h2 className="font-bold text-xs uppercase tracking-widest text-zinc-400">All Nodes</h2>
          </div>
          <div className="w-full space-y-1">
            {allTrees.map((e) => (
              <SidebarTreeView
                key={e.name}
                icon={e.icon}
                name={e.name}
                childrenNodes={e.nodes}
                onClick={(id) => onClickNode(id)}
              />
            ))}
          </div>
        </div>
      </div>
      <div
        className={twMerge(
          "flex flex-col space-y-2 items-start w-full max-h-full p-1",
          query === "" && "hidden"
        )}
      >
        <div className="flex flex-col w-full p-2 border-b border-black bg-black/10 shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div className="flex flex-col">
              <h2 className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                Search Results
              </h2>
              <span className="text-blue-400 text-xs font-mono">{filteredNodesCount} matches</span>
            </div>

            <div className="flex bg-black/40 p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => setFilterDisplayMode("tree")}
                className={twMerge(
                  "p-1.5 rounded-md transition-all flex items-center space-x-1.5",
                  filterDisplayMode === "tree" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
                title="Tree View"
              >
                <VscListTree size={14} />
                <span className="text-[10px] font-bold uppercase px-1">Tree</span>
              </button>
              <button
                onClick={() => setFilterDisplayMode("flat")}
                className={twMerge(
                  "p-1.5 rounded-md transition-all flex items-center space-x-1.5",
                  filterDisplayMode === "flat" ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
                title="Flat View"
              >
                <VscListFlat size={14} />
                <span className="text-[10px] font-bold uppercase px-1">Flat</span>
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-scroll w-full">
          {filteredNodes.map((node) => (
            <SidebarTreeView
              key={node.name}
              name={node.name}
              icon={node.icon}
              childrenNodes={node.nodes}
              onClick={(id) => onClickNode(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
