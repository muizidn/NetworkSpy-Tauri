import { invoke } from '@tauri-apps/api/core';

export const useLicense = () => {
    /**
     * Securely check if a feature is enabled by querying the Rust backend.
     * This makes it much harder for attackers to bypass checks by modifying JS.
     */
    const checkFeature = async (feature: 'scripting' | 'mcp' | 'breakpoints' | 'custom_viewers' | 'premium'): Promise<boolean> => {
        try {
            return await invoke<boolean>("license_check_feature", { feature });
        } catch (e) {
            console.error("Feature check failed", e);
            return false;
        }
    };

    /**
     * Get a numerical limit (e.g., max tabs, max filters) from the secure backend.
     */
    const getLimit = async (limitName: 'max_tabs' | 'max_filters'): Promise<number> => {
        try {
            return await invoke<number>("license_get_limit", { limitName });
        } catch (e) {
            console.error("Limit check failed", e);
            return limitName === 'max_tabs' ? 2 : 3;
        }
    };

    return { checkFeature, getLimit };
};
