import React from "react";
import { FiPlay } from "react-icons/fi";
import { ViewerBlock } from "@src/context/ViewerContext";
import { RenderText } from "../renderers/RenderText";
import { RenderJson } from "../renderers/RenderJson";
import { RenderTable } from "../renderers/RenderTable";
import { RenderHtml } from "../renderers/RenderHtml";

export const renderResult = (type: ViewerBlock['type'], data: any) => {
    // Placeholder view (stays styled)
    if (data === undefined || data === null) {
        return (
            <div className="h-20 flex flex-col items-center justify-center border border-dashed border-zinc-800/50 rounded-2xl bg-zinc-950/30 m-4">
                <FiPlay size={18} className="text-zinc-700 mb-1" />
                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Ready for {type.toUpperCase()} Preview</span>
            </div>
        );
    }

    // Result view: Stripped of padding/border/rounding
    switch (type) {
        case 'text':
            return <RenderText data={data} />;

        case 'json':
        case 'headers':
            return <RenderJson data={data} />;

        case 'table':
            return <RenderTable data={data} />;

        case 'html':
            return <RenderHtml data={data} />;

        default:
            return (
                <div className="w-full bg-transparent m-0 border-none rounded-none p-5 text-xs text-zinc-600 uppercase font-bold tracking-widest">
                    Unknown Block Type: {type}
                </div>
            );
    }
};