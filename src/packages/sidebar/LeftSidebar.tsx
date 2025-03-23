import { useEffect, useMemo, useState } from "react";
import { BsPinAngleFill } from "react-icons/bs";
import { VscListFlat } from "react-icons/vsc";
import { GrStorage } from "react-icons/gr";
import { LuAppWindow } from "react-icons/lu";
import { GoGlobe } from "react-icons/go";

import { filterNode, SidebarTreeView, TreeNode } from "./TreeView";
import { twMerge } from "tailwind-merge";
import { useTrafficListContext } from "../main-content/context/TrafficList";
import {
  groupUrlsInTree,
  kTreeNodeIdPrefixSeparator,
} from "./parseUrlToTreeNode";

type FilterDisplayMode = "tree" | "flat";

export const LeftSidebar = () => {
  const { trafficList, setFilterByUrl } = useTrafficListContext();

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
    const urls = trafficList.filter((t) => t.url).map((t) => t.url as string);
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
    setFilterByUrl(url);
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
      <div className="flex items-end space-x-2 w-full px-2 h-8">
        <button className="btn btn-xs bg-[#474b49] rounded text-white">
          +
        </button>
        <input
          type="text"
          className="input input-xs flex-grow rounded bg-[#474b49] w-full"
          placeholder="Search"
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
        <div className={twMerge("flex flex-col space-y-2 items-start w-full")}>
          <h2 className="font-bold text-xl text-white">Favorites</h2>
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
        <div className={twMerge("flex flex-col space-y-2 items-start w-full")}>
          <h2 className="font-bold text-xl text-white">All</h2>
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
      <div
        className={twMerge(
          "flex flex-col space-y-2 items-start w-full max-h-full p-1",
          query === "" && "hidden"
        )}
      >
        <div className="flex justify-between w-full items-center">
          <h2 className="font-bold text-lg text-white">
            Filter Result: ({filteredNodesCount}) result
          </h2>
          <select
            value={filterDisplayMode}
            className="text-nowrap h-fit p-2"
            onChange={(e) =>
              setFilterDisplayMode(e.target.value as FilterDisplayMode)
            }
          >
            <option value="tree">Tree</option>
            <option value="flat">Flat</option>
          </select>
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
