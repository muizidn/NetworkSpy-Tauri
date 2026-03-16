import React from "react";
import { FiPlay } from "react-icons/fi";
import { JSONTree } from "react-json-tree";
import { ViewerBlock } from "@src/context/ViewerContext";

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

export const renderResult = (type: ViewerBlock['type'], data: any) => {
    // Keep the placeholder styled so it doesn't look invisible when empty
    if (data === undefined || data === null) {
        return (
            <div className="h-20 flex flex-col items-center justify-center border border-dashed border-zinc-800/50 rounded-2xl bg-zinc-950/30">
                <FiPlay size={18} className="text-zinc-700 mb-1" />
                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Ready for Preview</span>
                <p className="text-[8px] text-zinc-700 mt-1">Select a traffic item from the right to run</p>
            </div>
        );
    }

    // Data exists, stripping padding, borders, and rounded corners
    switch (type) {
        case 'text':
            return <div className="text-zinc-300 font-medium text-sm leading-relaxed">{String(data)}</div>;

        case 'json':
        case 'headers':
            return (
                <div className="bg-black/20">
                    <JSONTree
                        data={data}
                        theme={theme}
                        invertTheme={false}
                        hideRoot={true}
                        labelRenderer={(keyPath: ReadonlyArray<string | number>) => <span className="text-zinc-500 font-mono text-xs font-bold">{keyPath[0]}:</span>}
                        valueRenderer={(val: any) => <span className="text-orange-400 font-mono text-xs">{String(val)}</span>}
                    />
                </div>
            );

        case 'table':
            if (!Array.isArray(data)) return <div className="text-red-400 text-xs">Table block expected an array of objects.</div>;
            const keys = data.length > 0 ? Object.keys(data[0]) : [];
            return (
                <div className="overflow-x-auto bg-black/20">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-800/40">
                                {keys.map(k => (
                                    <th key={k} className="px-5 py-3 text-[10px] font-black uppercase text-zinc-500 tracking-wider border-b border-zinc-800">{k}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                                    {keys.map(k => (
                                        <td key={k} className="px-5 py-3 border-b border-zinc-800/30 text-xs text-zinc-400 font-mono">{String(row[k])}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        case 'html':
            return (
                <div className="w-full bg-white min-h-[200px] flex flex-col">
                    <iframe
                        srcDoc={String(data)}
                        className="w-full flex-1 border-none min-h-[300px]"
                        sandbox="allow-scripts"
                        title="Block HTML Preview"
                    />
                </div>
            );

        default:
            return (
                <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap bg-black/40 p-5">
                    {JSON.stringify(data, null, 2)}
                </pre>
            );
    }
};