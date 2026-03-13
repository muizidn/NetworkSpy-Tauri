import React, { useMemo } from 'react';

export const HexView = ({ data }: { data: Uint8Array }) => {
    const hexData = useMemo(() => {
        if (!data || data.length === 0) return [];
        
        const bytes = data;
        const rows = [];
        const perRow = 16;
        
        for (let i = 0; i < bytes.length; i += perRow) {
            const chunk = bytes.slice(i, i + perRow);
            const hex = Array.from(chunk).map(b => b.toString(16).padStart(2, '0').toUpperCase());
            const ascii = Array.from(chunk).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
            
            rows.push({
                address: i.toString(16).padStart(8, '0').toUpperCase(),
                bytes: hex,
                ascii: ascii
            });
        }
        return rows;
    }, [data]);

    if (!data) return null;

    return (
        <div className="font-mono text-[11px] leading-relaxed select-text">
            <div className="flex border-b border-white/5 pb-2 mb-2 text-zinc-600 font-bold uppercase tracking-widest text-[9px]">
                <div className="w-20">Address</div>
                <div className="flex-grow grid gap-1 px-4" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="text-center">{i.toString(16).toUpperCase()}</div>
                    ))}
                </div>
                <div className="w-32 pl-4 border-l border-white/5">ASCII</div>
            </div>
            
            <div className="space-y-0.5">
                {hexData.map((row, idx) => (
                    <div key={idx} className="flex group hover:bg-white/[0.02] transition-colors rounded">
                        <div className="w-20 text-zinc-500 font-bold">{row.address}</div>
                        <div className="flex-grow grid gap-1 px-4 text-zinc-300" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
                            {row.bytes.map((b, i) => (
                                <div key={i} className="text-center hover:text-blue-400 cursor-default">{b}</div>
                            ))}
                            {/* Pad empty columns if row is short */}
                            {row.bytes.length < 16 && Array.from({ length: 16 - row.bytes.length }).map((_, i) => (
                                <div key={i} className="text-center opacity-0">00</div>
                            ))}
                        </div>
                        <div className="w-32 pl-4 border-l border-white/5 text-zinc-500 italic truncate">
                            {row.ascii}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
