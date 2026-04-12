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

export const RenderHtml = ({ data, unsafe }: { data: any, unsafe?: boolean }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        if (unsafe && containerRef.current) {
            const runScripts = async () => {
                if (!containerRef.current) return;
                
                // 1. Manually set content to clear any previous state and get raw scripts
                containerRef.current.innerHTML = String(data);
                
                // 2. Extract scripts in their original order
                const scripts = Array.from(containerRef.current.querySelectorAll("script"));
                
                for (const oldScript of scripts) {
                    await new Promise<void>((resolve) => {
                        const newScript = document.createElement("script");
                        
                        // Copy all attributes
                        Array.from(oldScript.attributes).forEach((attr) =>
                            newScript.setAttribute(attr.name, attr.value)
                        );
                        
                        // Copy content
                        const content = oldScript.text || oldScript.textContent || "";
                        if (!newScript.src && content) {
                            // Wrap inline scripts in a block scope to prevent global variable collisions
                            newScript.text = `{\n${content}\n}`;
                        } else {
                            newScript.text = content;
                        }

                        if (newScript.src) {
                            newScript.onload = () => resolve();
                            newScript.onerror = () => resolve();
                        } else {
                            // Inline scripts run immediately on insertion
                            // Wait for next tick to ensure browser processes it
                            setTimeout(resolve, 0);
                        }

                        // Replace to trigger execution
                        if (oldScript.parentNode) {
                            oldScript.parentNode.replaceChild(newScript, oldScript);
                        } else {
                            resolve();
                        }
                    });
                }
            };
            runScripts();
        }
    }, [data, unsafe]);

    if (unsafe) {
        return (
            <div 
                ref={containerRef}
                className="w-full h-full min-h-[150px] bg-transparent overflow-visible p-0 m-0"
            />
        );
    }

    return (
        <div className="w-full bg-transparent m-0 border-none rounded-none overflow-hidden">
            <AutoResizingIframe html={String(data)} />
        </div>
    );
};
