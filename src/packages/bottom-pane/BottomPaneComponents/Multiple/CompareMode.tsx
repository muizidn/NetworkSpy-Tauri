import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useMemo } from "react";

export const CompareMode = () => {
  const { selections } = useTrafficListContext();
  const selectedItems = selections.others || [];

  if (selectedItems.length < 2) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 bg-[#1e1e1e]">
        <div className="text-4xl opacity-10 mb-4 font-bold">COMPARE</div>
        <div className="text-sm">Select at least 2 requests to compare</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#1e1e1e] overflow-auto p-4">
      <div className="inline-block min-w-full">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-900">
              <th className="border border-zinc-700 p-2 text-left text-zinc-500 uppercase sticky left-0 z-10 bg-zinc-900">Property</th>
              {selectedItems.map((item) => (
                <th key={String(item.id)} className="border border-zinc-700 p-2 text-left min-w-[250px]">
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-800 px-1.5 rounded text-zinc-400">#{item.id}</span>
                    <span className="font-mono text-zinc-300">{String(item.method)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow label="URL" property="url" items={selectedItems} />
            <CompareRow label="Status" property="status" items={selectedItems} highlight />
            <CompareRow label="Content Type" property="content_type" items={selectedItems} />
            <CompareRow label="Duration" property="duration" items={selectedItems} />
            <CompareRow label="Time" property="time" items={selectedItems} />
            <CompareRow label="Size" property="size" items={selectedItems} />
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CompareRow = ({ label, property, items, highlight = false }: { label: string; property: string; items: any[]; highlight?: boolean }) => {
  const values = items.map(item => String(item[property] || "N/A"));
  const allSame = values.every(v => v === values[0]);

  return (
    <tr className={`${highlight ? 'bg-zinc-900/30' : ''} hover:bg-zinc-800/50 transition-colors`}>
      <td className="border border-zinc-700 p-2 font-semibold text-zinc-400 sticky left-0 z-10 bg-[#1e1e1e] whitespace-nowrap">{label}</td>
      {values.map((val, i) => (
        <td key={i} className={`border border-zinc-700 p-2 font-mono ${!allSame && i > 0 ? 'text-orange-400' : 'text-zinc-300'}`}>
          <div className="max-h-20 overflow-auto break-all">
            {val}
          </div>
        </td>
      ))}
    </tr>
  );
};
