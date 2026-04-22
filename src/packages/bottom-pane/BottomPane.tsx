import { invoke } from "@tauri-apps/api/core";
import { useState, Suspense } from "react";
import { FiAlertCircle } from "react-icons/fi";

import { SelectionViewer } from "../main-content/SelectionViewer";
import { useBottomPaneContext } from "@src/context/BottomPaneContext";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import { useTrafficListContext } from "../main-content/context/TrafficList";
import { useAppProvider } from "../app-env";
import { Dialog } from "../ui/Dialog";
import { ContainerQueryProvider } from "@src/context/ContainerQueryContext";

import { renderMode } from "./renderMode";
import { NotInterceptedMode } from "./BottomPaneComponents/None/NotInterceptedMode";

import { InterceptionActionBar } from "./BottomPaneComponents/InterceptionActionBar";

export const BottomPane = () => {
  const { mode, selectionType } = useBottomPaneContext();
  const [sizes, setSizes] = useState<any[]>(["50%", "50%"]);
  const { selections } = useTrafficListContext();
  const { provider } = useAppProvider();
  
  const [isIntercepting, setIsIntercepting] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'error' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const selected = selections.firstSelected;
  const isAdded = selected && addedIds.has(String(selected.id));

  const handleIntercept = async () => {
    if (!selected || !selected.url) return;
    try {
      setIsIntercepting(true);
      const url = new URL(selected.url as string);
      const domain = url.hostname;
      await provider.updateInterceptAllowList([domain]);
      setAddedIds(prev => new Set(prev).add(String(selected.id)));
    } catch (e) {
      console.error(e);
      setDialogConfig({
        isOpen: true,
        title: 'Update Failed',
        message: "Failed to update interception settings. Please check console for details.",
        type: 'error'
      });
    } finally {
      setIsIntercepting(false);
    }
  };

  const handleInterceptAll = async () => {
    if (!selections.others) return;
    try {
      setIsIntercepting(true);
      const tunneledDomains = Array.from(new Set(
        selections.others
          .filter(t => t && !t.intercepted && t.url)
          .map(t => {
            try { return new URL(t.url as string).hostname; } catch { return null; }
          })
          .filter(Boolean) as string[]
      ));

      if (tunneledDomains.length === 0) return;

      await provider.updateInterceptAllowList(tunneledDomains);
      
      setAddedIds(prev => {
        const next = new Set(prev);
        selections.others?.forEach(t => { if(t) next.add(String(t.id)); });
        return next;
      });
    } catch (e) {
      console.error(e);
      setDialogConfig({
        isOpen: true,
        title: 'Batch Update Failed',
        message: "Failed to process batch update.",
        type: 'error'
      });
    } finally {
      setIsIntercepting(false);
    }
  };

  const isMultiple = selectionType === "multiple";
  const tunneledCount = selections.others ? selections.others.filter(t => t && !t.intercepted).length : 0;
  const interceptedCount = selections.others ? selections.others.filter(t => t && t.intercepted).length : 0;

  return (
    <div className="flex flex-col w-full relative h-full">
      {selections.firstSelected && <SelectionViewer />}
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-zinc-600 italic text-xs animate-pulse">
            Loading viewer...
          </div>
        }>
          <div className="flex-grow overflow-y-auto h-full custom-scrollbar bg-[#111] pb-12 @container">
            <ContainerQueryProvider>
            {(() => {
              if (!selected) return renderMode(mode, sizes, setSizes);

              if (isMultiple) return renderMode(mode, sizes, setSizes);

              if (selected.intercepted) {
                return renderMode(mode, sizes, setSizes);
              }

              const getHostname = (url: string) => {
                try {
                  const u = url.includes("://") ? url : `https://${url}`;
                  return new URL(u).hostname;
                } catch {
                  return url.split(":")[0] || "-";
                }
              };

              const domain = getHostname(selected.url as string);
              const clientInfo = selected.client ? (() => {
                try {
                  return JSON.parse(selected.client as string);
                } catch {
                  return null;
                }
              })() : null;

              return (
                <NotInterceptedMode 
                  domain={domain}
                  isAdded={!!isAdded}
                  isIntercepting={isIntercepting}
                  handleIntercept={handleIntercept}
                  clientName={clientInfo?.name}
                  onInterceptClient={async (client) => {
                    try {
                      setIsIntercepting(true);
                      await invoke("save_proxy_rule", {
                        rule: {
                          id: "",
                          enabled: true,
                          name: `Intercept ${client}`,
                          pattern: `client:${client}`,
                          action: "INTERCEPT"
                        }
                      });
                      setAddedIds(prev => new Set(prev).add(String(selected.id)));
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsIntercepting(false);
                    }
                  }}
                />
              );
            })()}
            </ContainerQueryProvider>
          </div>
        </Suspense>
      </ErrorBoundary>

      {selected && (
        <InterceptionActionBar 
          isMultiple={isMultiple}
          tunneledCount={tunneledCount}
          interceptedCount={interceptedCount}
          isAdded={!!isAdded}
          isIntercepting={isIntercepting}
          handleIntercept={handleIntercept}
          handleInterceptAll={handleInterceptAll}
          isIntercepted={!!selected.intercepted}
        />
      )}

      <Dialog 
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};