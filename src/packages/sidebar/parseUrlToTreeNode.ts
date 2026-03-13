import { TreeNode } from "./TreeView";
import { v4 as uuidv4 } from 'uuid';

export const kTreeNodeIdPrefixSeparator = '---@@@---'


export function groupUrlsInTree(
  idPrefix: string,
  trafficItems: any[],
  strategy: "domain" | "app" = "domain"
): TreeNode[] {
  const root: Record<string, TreeNode> = {};

  trafficItems.forEach((item) => {
    const url = item.url as string;
    if (!url) return;

    let groupKey = "";
    try {
      const urlObj = new URL(url);
      if (strategy === "domain") {
        groupKey = urlObj.hostname;
      } else if (strategy === "app") {
        // client is often "AppName (127.0.0.1:port)"
        const client = item.client as string || "Unknown";
        groupKey = client.split(" (")[0];
      }

      const domain = urlObj.hostname;
      const pathSegments = urlObj.pathname.split("/").filter(Boolean);
      const idBase = `${idPrefix}${kTreeNodeIdPrefixSeparator}${groupKey}`;

      if (!root[groupKey]) {
        root[groupKey] = { id: idBase, name: groupKey, children: [] };
      }

      let currentNode = root[groupKey];

      // If grouping by app, we might want to nest domain inside app
      if (strategy === "app") {
        const domainId = `${idBase}/${domain}`;
        let domainNode = currentNode.children?.find(c => c.id === domainId);
        if (!domainNode) {
          domainNode = { id: domainId, name: domain, children: [] };
          currentNode.children?.push(domainNode);
        }
        currentNode = domainNode;
      }

      const currentPathPrefix = currentNode.id;
      pathSegments.forEach((segment, index) => {
        const fullPath = `${currentPathPrefix}/${pathSegments.slice(0, index + 1).join("/")}`;
        let pathNode = currentNode.children?.find((child) => child.id === fullPath);

        if (!pathNode) {
          pathNode = { id: fullPath, name: segment, children: [] };
          currentNode.children?.push(pathNode);
        }
        currentNode = pathNode;
      });
    } catch (e) {
      console.error("Failed to parse URL in sidebar:", url);
    }
  });

  return Object.values(root);
}