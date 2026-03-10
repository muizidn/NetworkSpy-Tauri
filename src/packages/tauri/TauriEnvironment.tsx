/**
 * TauriEnvironment
 *
 * This component ensures that its children UI is only rendered
 * when the application is running inside a Tauri runtime.
 *
 * When the app is opened in a normal browser environment
 * (for example during web development), `window.__TAURI__`
 * will not exist, and a fallback message will be displayed instead.
 *
 * This helps prevent UI components that depend on Tauri APIs
 * (like `invoke`, filesystem, etc.) from running in unsupported environments.
 */
export const TauriEnvironment = ({ children }: { children: React.ReactNode }) => {
    const isTauri = window.__TAURI__;

    if (!isTauri) {
        return <div>Tauri is not available</div>;
    }

    return children;
};