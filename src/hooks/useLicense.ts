import { useMemo } from 'react';
import { useSettingsContext } from '../context/SettingsProvider';

export type PlanType = 'free' | 'personal' | 'pro';

export interface Features {
    maxCustomViewers: number;
    maxMainTabs: number;
    maxFilterPresets: number;
    maxTagFolders: number;
    canUseMcp: boolean;
    canUseScripting: boolean;
    canUseBreakpoints: boolean;
    isPremium: boolean;
}

export const useLicense = () => {
    const { plan, isVerified, apiFeatures } = useSettingsContext();

    const features = useMemo<Features>(() => {
        // If API returned features, use them (merged with defaults to ensure all fields exist)
        if (isVerified && apiFeatures) {
            return {
                maxCustomViewers: apiFeatures.maxCustomViewers ?? 3,
                maxMainTabs: apiFeatures.maxMainTabs ?? 3,
                maxFilterPresets: apiFeatures.maxFilterPresets ?? 5,
                maxTagFolders: apiFeatures.maxTagFolders ?? 2,
                canUseMcp: apiFeatures.canUseMcp ?? false,
                canUseScripting: apiFeatures.canUseScripting ?? false,
                canUseBreakpoints: apiFeatures.canUseBreakpoints ?? false,
                isPremium: apiFeatures.isPremium ?? false,
            };
        }

        const currentPlan: PlanType = isVerified ? (plan as PlanType || 'free') : 'free';

        switch (currentPlan) {
            case 'pro':
                return {
                    maxCustomViewers: Infinity,
                    maxMainTabs: Infinity,
                    maxFilterPresets: Infinity,
                    maxTagFolders: Infinity,
                    canUseMcp: true,
                    canUseScripting: true,
                    canUseBreakpoints: true,
                    isPremium: true,
                };
            case 'personal':
                return {
                    maxCustomViewers: Infinity,
                    maxMainTabs: 10,
                    maxFilterPresets: 20,
                    maxTagFolders: 10,
                    canUseMcp: true,
                    canUseScripting: true,
                    canUseBreakpoints: true,
                    isPremium: true,
                };
            case 'free':
            default:
                return {
                    maxCustomViewers: 3,
                    maxMainTabs: 3,
                    maxFilterPresets: 5,
                    maxTagFolders: 2,
                    canUseMcp: false,
                    canUseScripting: false,
                    canUseBreakpoints: false,
                    isPremium: false,
                };
        }
    }, [plan, isVerified, apiFeatures]);

    return {
        plan,
        isVerified,
        features,
    };
};
