import React, { useState, useMemo } from "react";
import Editor from "@monaco-editor/react";
import { ViewerBlock } from "@src/context/ViewerContext";
import { FiCopy, FiInfo, FiLayers, FiMaximize } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

interface FullSourceEditorProps {
    viewerName: string;
    blocks: ViewerBlock[];
    testResults: Record<string, any>;
}

export const FullSourceEditor: React.FC<FullSourceEditorProps> = ({
    viewerName, blocks, testResults
}) => {
    const [isBeautified, setIsBeautified] = useState(true);

    const formatHTML = (html: string) => {
        let tab = '    ';
        let result = '';
        let indent = '';

        html.split(/>\s*</).forEach(function (element) {
            if (element.match(/^\/\w/)) {
                indent = indent.substring(tab.length);
            }

            result += indent + '<' + element + '>\r\n';

            if (element.match(/^<?\w[^>]*[^\/]$/) && !element.match(/^<(link|meta|base|br|img|hr|input)/)) {
                indent += tab;
            }
        });

        return result.substring(1, result.length - 3);
    };

    const source = useMemo(() => {
        function generateBlockContent(block: ViewerBlock) {
            const result = testResults[block.id];
            if (block.type === 'html' && result) return result;
            return `<pre style="padding:20px">${JSON.stringify(result, null, 2)}</pre>`;
        }

        const raw = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${viewerName} - Prototype</title>
    <style>
        body { background: #080808; color: #fff; font-family: sans-serif; margin: 0; padding: 20px; }
        .grid-container { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
        .viewer-block { background: #111; border: 1px solid #222; border-radius: 8px; overflow: hidden; }
        .text-block { font-family: monospace; white-space: pre-wrap; font-size: 12px; color: #aaa; }
        ${blocks.map(b => `.span-${b.id} { grid-column: span ${b.colSpan || 12}; }`).join('\n')}
    </style>
</head>
<body>
    <div class="grid-container">
        ${blocks.map(b => `<div class="viewer-block span-${b.id}">\n${generateBlockContent(b)}\n</div>`).join('\n        ')}
    </div>
</body>
</html>`;

        return isBeautified ? formatHTML(raw) : raw;
    }, [viewerName, blocks, testResults, isBeautified]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#080808] animate-in fade-in duration-300">
            {/* Source Header Info */}
            <div className="px-8 py-4 bg-[#0a0a0c] border-b border-zinc-900 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                    <FiInfo className="text-amber-500/50" size={16} />
                    <div>
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Assembled HTML Prototype</h4>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">Snapshot of the current execution state in the browser</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsBeautified(!isBeautified)}
                        className={twMerge(
                            "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border",
                            isBeautified 
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-500" 
                                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                        )}
                        title={isBeautified ? "Show Minified View" : "Pretty Print (Beautify)"}
                    >
                        <FiLayers size={12} />
                        {isBeautified ? "Beautified" : "Beautify"}
                    </button>

                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(source);
                            alert("Source code copied to clipboard!");
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all border border-zinc-800 hover:border-zinc-600 shadow-sm"
                    >
                        <FiCopy size={12} />
                        Copy HTML
                    </button>
                </div>
            </div>

            <div className="flex-1">
                <Editor
                    theme="vs-dark"
                    language="html"
                    options={{
                        readOnly: true,
                        minimap: { enabled: true },
                        fontSize: 12,
                        lineNumbers: "on",
                        wordWrap: "on",
                        padding: { top: 20, bottom: 20 },
                        formatOnPaste: true,
                        formatOnType: true
                    }}
                    value={source}
                />
            </div>
        </div>
    );
};
