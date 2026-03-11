import { JSONTree } from "react-json-tree";

export const TreeView = ({ data }: { data: string }) => {
  try {
    const json = JSON.parse(data || "{}");
    return (
      <div className="p-2 overflow-auto h-full">
        <JSONTree data={json} invertTheme={true} />
      </div>
    );
  } catch (e) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 italic text-xs p-4">
        Invalid JSON data: Unable to render tree view.
      </div>
    );
  }
};
