import { JSONTree } from "react-json-tree";

const theme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: 'transparent',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633',
};

export const TreeView = ({ data }: { data: string }) => {
  try {
    const json = JSON.parse(data || "{}");
    return (
      <div className="p-4 overflow-auto h-full bg-[#0c0c0c] rounded-xl border border-zinc-800/30 m-2 shadow-inner">
        <JSONTree 
          data={json} 
          theme={theme} 
          invertTheme={false} 
          hideRoot={false}
        />
      </div>
    );
  } catch (e) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 italic text-xs p-4">
        <div className="bg-red-500/5 px-4 py-2 rounded-lg border border-red-500/10">
            Invalid JSON: Hierarchy cannot be generated.
        </div>
      </div>
    );
  }
};
