import React, { useState, useRef, useEffect } from "react";
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

/**
 * Sub-component to handle height sync via postMessage
 * This bypasses Cross-Origin/Sandbox access violations
 */
const AutoResizingIframe = ({ html }: { html: string }) => {
    const [height, setHeight] = useState("100px");

    // Inject a measurement script into the HTML content
    const finalHtml = `
        <!DOCTYPE html>
        <html>
            <head>
                <style>
                    body { margin: 0; padding: 0; overflow: hidden; font-family: sans-serif; }
                    #wrapper { width: 100%; display: inline-block; }
                </style>
            </head>
            <body>
                <div id="wrapper">${html}</div>
                <script>
                    const wrapper = document.getElementById('wrapper');
                    function reportHeight() {
                        const h = wrapper.offsetHeight;
                        window.parent.postMessage({ type: 'iframe-resize', height: h }, '*');
                    }
                    // Report on load and whenever things change
                    window.onload = reportHeight;
                    new MutationObserver(reportHeight).observe(wrapper, { 
                        childList: true, subtree: true, attributes: true 
                    });
                    // Periodic check for dynamic assets (images, etc)
                    setInterval(reportHeight, 1000);
                </script>
            </body>
        </html>
    `;

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'iframe-resize') {
                setHeight(`${event.data.height}px`);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <iframe
            srcDoc={finalHtml}
            style={{ height, minHeight: height }}
            className="w-full border-none block overflow-hidden transition-[height] duration-200"
            sandbox="allow-scripts"
            title="Block HTML Preview"
        />
    );
};

export const renderResult = (type: ViewerBlock['type'], data: any) => {
    // Placeholder view (stays styled)
    if (data === undefined || data === null) {
        return (
            <div className="h-20 flex flex-col items-center justify-center border border-dashed border-zinc-800/50 rounded-2xl bg-zinc-950/30 m-4">
                <FiPlay size={18} className="text-zinc-700 mb-1" />
                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Ready for Preview</span>
            </div>
        );
    }

    // Result view: Stripped of padding/border/rounding
    switch (type) {
        case 'text':
            return <div className="text-zinc-300 font-medium text-sm leading-relaxed p-5">{String(data)}</div>;

        case 'json':
        case 'headers':
            return (
                <div className="bg-black/20 m-0 border-none rounded-none">
                    <JSONTree
                        data={data}
                        theme={theme}
                        invertTheme={false}
                        hideRoot={true}
                        labelRenderer={(keyPath) => <span className="text-zinc-500 font-mono text-xs font-bold">{keyPath[0]}:</span>}
                        valueRenderer={(val) => <span className="text-orange-400 font-mono text-xs">{String(val)}</span>}
                    />
                </div>
            );

        case 'table':
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

        case 'html':
            return (
                <div className="w-full bg-white m-0 border-none rounded-none overflow-hidden">
                    <AutoResizingIframe html={String(data)} />
                </div>
            );

        default:
            return (
                <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap bg-black/40 p-5 m-0 border-none rounded-none">
                    {JSON.stringify(data, null, 2)}
                </pre>
            );
    }
};