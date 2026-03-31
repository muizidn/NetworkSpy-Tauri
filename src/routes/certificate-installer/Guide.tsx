import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import React, { useState, useEffect, useRef } from 'react';
import { FiCopy, FiExternalLink, FiHelpCircle, FiCheckCircle, FiDownload, FiLoader, FiTrash2, FiTerminal } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { useSettingsContext } from '@src/context/SettingsProvider';

export interface GuideStep {
  title: string;
  description: string | JSX.Element;
  codeBlocks?: { fileName: string, code: string }[];
}

interface GuideProps {
  platform: string;
  steps: GuideStep[];
  icon: React.ReactNode;
}

const Guide: React.FC<GuideProps> = ({ platform, steps, icon }) => {
  const { streamCertificateLogs } = useSettingsContext();
  const [installing, setInstalling] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [uninstallStatus, setUninstallStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [uninstallMsg, setUninstallMsg] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!streamCertificateLogs) {
      return;
    }

    let unlisten: (() => void) | undefined;
    
    listen<string>("certificate_log", (event) => {
      setLogs(prev => [...prev, event.payload]);
    }).then(fn => { unlisten = fn; });

    return () => {
      if (unlisten) unlisten();
    };
  }, [streamCertificateLogs]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const clearLogs = () => setLogs([]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleInstall = async () => {
    setInstalling(true);
    setStatus("idle");
    try {
      await invoke("auto_install_certificate");
      setStatus("success");
    } catch (e) {
      console.error(e);
      setStatus("error");
      setErrorMsg(String(e));
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstall = async () => {
    setUninstalling(true);
    setUninstallStatus("idle");
    try {
      const result = await invoke<string>("uninstall_certificate");
      setUninstallStatus("success");
      setUninstallMsg(result);
    } catch (e) {
      console.error(e);
      setUninstallStatus("error");
      setUninstallMsg(String(e));
    } finally {
      setUninstalling(false);
    }
  };

  return (
    <div className="bg-[#050505] text-zinc-300 h-full flex flex-col overflow-auto scroll-smooth">
      <div className="max-w-4xl mx-auto w-full p-8 md:p-12">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-12 border-b border-zinc-900 pb-12">
            <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">
                <span>Installation</span>
                <span className="text-zinc-800">•</span>
                <span>{platform}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h1 className="text-4xl md:text-5xl font-black text-white flex items-center gap-4 tracking-tight">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-xl overflow-hidden p-2 text-zinc-400">
                        {icon}
                    </div>
                    <span>{platform} Setup</span>
                </h1>

                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        <button 
                            onClick={handleInstall}
                            disabled={installing}
                            className={twMerge(
                                "group flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all duration-300 shadow-2xl relative overflow-hidden",
                                status === "success" 
                                    ? "bg-green-600/20 text-green-400 border border-green-500/30" 
                                    : status === "error"
                                        ? "bg-red-600 text-white"
                                        : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95"
                            )}
                        >
                            {installing ? (
                                <FiLoader className="animate-spin" size={18} />
                            ) : status === "success" ? (
                                <FiCheckCircle size={18} />
                            ) : (
                                <FiDownload size={18} />
                            )}
                            <span>
                                {installing ? "Installing..." : status === "success" ? "Certificate Installed" : "One-Click Install CA"}
                            </span>
                        </button>
                        <button 
                            onClick={handleUninstall}
                            disabled={uninstalling}
                            className={twMerge(
                                "group flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all duration-300 border",
                                uninstallStatus === "success" 
                                    ? "bg-green-600/20 text-green-400 border-green-500/30" 
                                    : uninstallStatus === "error"
                                        ? "bg-red-600 text-white border-red-600"
                                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-700 active:scale-95"
                            )}
                        >
                            {uninstalling ? (
                                <FiLoader className="animate-spin" size={18} />
                            ) : uninstallStatus === "success" ? (
                                <FiCheckCircle size={18} />
                            ) : (
                                <FiTrash2 size={18} />
                            )}
                            <span>
                                {uninstalling ? "Uninstalling..." : uninstallStatus === "success" ? "Uninstalled" : "Uninstall CA"}
                            </span>
                        </button>
                    </div>
                    {(status === "error" || uninstallStatus === "error") && (
                        <p className="text-[10px] text-red-500 font-medium max-w-[300px] leading-tight">
                            {status === "error" ? errorMsg : uninstallMsg}
                        </p>
                    )}
                    {uninstallStatus === "success" && (
                        <p className="text-[10px] text-green-500 font-medium max-w-[300px] leading-tight">
                            {uninstallMsg}
                        </p>
                    )}
                </div>
            </div>
            <p className="text-zinc-500 text-sm max-w-xl leading-relaxed mt-4">
                Follow this guide to configure your {platform} environment. Use the <b>One-Click Install</b> button above for a faster setup.
            </p>
        </div>

        {/* Steps Section */}
        <div className="flex flex-col gap-16">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-6 md:gap-8 group">
              {/* Number Column */}
              <div className="flex flex-col items-center shrink-0">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm font-black text-zinc-500 group-hover:border-blue-500/50 group-hover:text-blue-500 transition-all duration-300">
                    {index + 1}
                  </div>
                  <div className="w-px flex-grow bg-gradient-to-b from-zinc-800 to-transparent mt-4" />
              </div>

              {/* Content Column */}
              <div className="flex-grow pt-1 pb-4">
                <h2 className="text-xl font-bold text-white mb-4 tracking-tight group-hover:text-blue-400 transition-colors">
                    {step.title}
                </h2>
                <div className="text-zinc-400 text-[13px] leading-relaxed mb-6 prose prose-invert prose-sm max-w-none">
                    {step.description}
                </div>

                {step.codeBlocks && step.codeBlocks.length > 0 && (
                  <div className="flex flex-col gap-4 mt-6">
                    {step.codeBlocks.map((block, blockIndex) => (
                      <div key={blockIndex} className="bg-[#0c0c0c] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/50 border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-zinc-800" />
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{block.fileName}</span>
                            </div>
                            <button 
                                onClick={() => copyToClipboard(block.code)}
                                className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-all active:scale-90"
                                title="Copy code"
                            >
                                <FiCopy size={12} />
                            </button>
                        </div>
                        <pre className="p-5 overflow-x-auto no-scrollbar font-mono text-[12px] leading-relaxed text-blue-300/80 bg-black/40">
                          <code>{block.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Log Panel */}
        {streamCertificateLogs && logs.length > 0 && (
          <div className="mt-12 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiTerminal size={14} className="text-green-500" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Certificate Logs</span>
              </div>
              <button 
                onClick={clearLogs}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="h-48 overflow-y-auto font-mono text-[11px] text-green-400/80 space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="break-all">{log}</div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-20 p-8 rounded-3xl bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/10 flex flex-col items-center text-center gap-6">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                <FiHelpCircle size={24} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-white mb-1">Stuck on {platform} integration?</h3>
                <p className="text-zinc-500 text-sm">Our community and documentation are here to help you solve complex proxy issues.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all shadow-xl shadow-blue-900/20 active:scale-95">
                    <FiExternalLink size={14} />
                    View Sample Project
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-full transition-all active:scale-95">
                    <FiCheckCircle size={14} />
                    Troubleshooting Hub
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Guide;