import { JSONTree } from "react-json-tree";

export const TreeView = ({ data }: { data: string }) => {
  const json = JSON.parse(data);
  return (
    <div className="p-2">
      <JSONTree data={json} />;
    </div>
  );
};
