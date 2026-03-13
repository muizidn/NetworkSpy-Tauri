/**
 * TauriEnvironment
 *
 * This component ensures that its children UI is only rendered
 * when the application is running inside a Tauri runtime.
 */
export const TauriEnvironment = ({ children }: { children: React.ReactNode }) => {
    const isTauri = (window as any).__TAURI_INTERNALS__ !== undefined;

    if (!isTauri) {
        return <div>Tauri is not available</div>;
    }

    return children;
};