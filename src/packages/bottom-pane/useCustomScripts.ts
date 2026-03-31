import { useAppProvider } from "@src/packages/app-env";
import { useCallback, useEffect, useState } from "react";
import SensitiveDataWorker from './Workers/SensitiveDataWorker?worker';
import { CustomChecker } from "@src/packages/app-env/AppProvider";

/**
 * Base finding interface that all custom scripts must at least fulfill.
 * System-level fields are added automatically by the hook.
 */
export interface BaseFinding {
    type: string;
}

/**
 * Sensitive Data finding model
 */
export interface SensitiveDataFinding extends BaseFinding {
    value: string;
    location: string;
    risk: string;
    solution: string;
}

/**
 * Header Explainer finding model
 */
export interface HeaderFinding extends BaseFinding {
    value: string;
    risk: string;
    solution: string;
}

/**
 * Code Snippet finding model
 */
export interface CodeSnippetFinding extends BaseFinding {
    value: string;
}

/**
 * Auth Analysis finding model
 */
export interface AuthFinding extends BaseFinding {
    value: string;
    risk: string;
    solution: string;
}

/**
 * Static Analysis finding model
 */
export interface StaticAnalysisFinding extends BaseFinding {
    value: string;
    risk: string;
    solution: string;
}

/**
 * Utility type to add system fields to any finding type
 */
export type CustomFinding<T> = T & {
    isCustom?: boolean;
    isError?: boolean;
    scriptName?: string;
};

export const useCustomScripts = <T extends BaseFinding>(
    category: string, 
    body: string | null, 
    headers: any
) => {
    const { provider } = useAppProvider();
    const [checkers, setCheckers] = useState<CustomChecker[]>([]);
    const [customFindings, setCustomFindings] = useState<CustomFinding<T>[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        provider.getCustomCheckers(category).then(setCheckers);
    }, [provider, category]);

    const runScripts = useCallback(async () => {
        if (!checkers.length) {
            setCustomFindings([]);
            return;
        }
        
        const enabledCheckers = checkers.filter(c => c.enabled);
        if (!enabledCheckers.length) {
            setCustomFindings([]);
            return;
        }

        setIsRunning(true);

        const runOne = (checker: CustomChecker): Promise<CustomFinding<T>[]> => {
            return new Promise((resolve) => {
                const worker = new SensitiveDataWorker();
                const timeout = setTimeout(() => {
                    worker.terminate();
                    // Fallback error finding - cast to unknown then to T
                    resolve([{ 
                        type: 'Timeout', 
                        value: `Checker "${checker.name}" timed out`, 
                        risk: 'High', 
                        solution: 'Optimize your script performance.',
                        isError: true,
                        scriptName: checker.name
                    } as unknown as CustomFinding<T>]);
                }, 3000);

                worker.onmessage = (e) => {
                    clearTimeout(timeout);
                    worker.terminate();
                    const results = e.data.results || [];
                    resolve(results.map((r: any) => ({
                        ...r,
                        type: r.type || checker.name,
                        scriptName: checker.name,
                        isCustom: true
                    } as CustomFinding<T>)));
                };
                worker.postMessage({ script: checker.script, body: body || '', headers, name: checker.name });
            });
        };

        try {
            const findings = await Promise.all(enabledCheckers.map(runOne));
            setCustomFindings(findings.flat());
        } finally {
            setIsRunning(false);
        }
    }, [checkers, body, headers]);

    useEffect(() => {
        runScripts();
    }, [runScripts]);

    return { 
        customFindings, 
        isRunning, 
        refreshScripts: () => provider.getCustomCheckers(category).then(setCheckers) 
    };
};
