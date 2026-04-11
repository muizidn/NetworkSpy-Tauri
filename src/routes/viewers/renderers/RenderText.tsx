import React from "react";

export const RenderText = ({ data }: { data: any }) => {
    return (
        <div className="text-zinc-300 font-medium text-sm leading-relaxed p-5 whitespace-pre-wrap font-mono">
            {String(data)}
        </div>
    );
};
