import React from "react";

export const RenderTable = ({ data }: { data: any }) => {
    if (!Array.isArray(data)) return <div className="text-red-400 text-xs p-5">Table expected an array.</div>;
    const keys = data.length > 0 ? Object.keys(data[0]) : [];
    
    return (
        <div className="overflow-x-auto bg-black/20 m-0 border-none rounded-none">
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
};
