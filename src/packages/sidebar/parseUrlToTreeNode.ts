import { TreeNode } from "./TreeView";
import { v4 as uuidv4 } from 'uuid';

export const kTreeNodeIdPrefixSeparator = '---@@@---'

export function groupUrlsInTree(idPrefix: string,urls: string[]): TreeNode[] {
  const root: Record<string, TreeNode> = {};

  urls.forEach((url) => {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const pathSegments = urlObj.pathname.split("/").filter(Boolean); // Split and remove empty segments

    const idDomain = `${idPrefix}${kTreeNodeIdPrefixSeparator}${urlObj.hostname}`

    // Ensure the domain node exists
    if (!root[domain]) {
      root[domain] = { id: idDomain, name: domain, children: [] };
    }

    let currentNode = root[domain];

    // Traverse or create path nodes under domain
    pathSegments.forEach((segment, index) => {
      // Build the full path for this node
      const fullPath = `${idDomain}/${pathSegments.slice(0, index + 1).join("/")}`;
      
      let pathNode = currentNode.children?.find(
        (child) => child.id === fullPath
      );

      if (!pathNode) {
        pathNode = { id: fullPath, name: segment, children: [] };
        currentNode.children?.push(pathNode);
      }

      currentNode = pathNode; // Move to the next level
    });
  });

  return Object.values(root);
}