import React, { useState, useEffect } from "react";

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
                    body { margin: 0; padding: 0; overflow: hidden; font-family: sans-serif; background:black; }
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

export const RenderHtml = ({ data }: { data: any }) => {
    return (
        <div className="w-full bg-transparent m-0 border-none rounded-none overflow-hidden">
            <AutoResizingIframe html={String(data)} />
        </div>
    );
};
