import { TreeNode } from "./TreeView";

export function groupUrlsInTree(name: string, urls: string[]): TreeNode {
  const root: Record<string, TreeNode> = {};

  urls.forEach((url) => {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const pathSegments = urlObj.pathname.split("/").filter(Boolean); // Split and remove empty segments

    // Ensure the domain node exists
    if (!root[domain]) {
      root[domain] = { name: domain, children: [] };
    }

    let currentNode = root[domain];

    // Traverse or create path nodes under domain
    pathSegments.forEach((segment) => {
      let pathNode = currentNode.children?.find(
        (child) => child.name === segment
      );
      if (!pathNode) {
        pathNode = { name: segment, children: [] };
        currentNode.children?.push(pathNode);
      }
      currentNode = pathNode; // Move to the next level
    });
  });

  return { name: name, children: Object.values(root) };
}
