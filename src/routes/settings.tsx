import React, { useState, useEffect } from 'react';
import { FiSettings, FiTarget, FiInfo, FiTerminal, FiCpu, FiPlay, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useSettingsContext } from '../context/SettingsProvider';
import { getVersion } from '@tauri-apps/api/app';

export default function Settings() {
    const {
        showConnectMethod,
        setShowConnectMethod,
        streamCertificateLogs,
        setStreamCertificateLogs,
        mcpStdioEnabled,
        setMcpStdioEnabled,
        mcpHttpEnabled,
        setMcpHttpEnabled,
        mcpHttpPort,
        setMcpHttpPort
    } = useSettingsContext();
    const [appVersion, setAppVersion] = useState<string>('0.0.0');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    const testMcpConnection = async () => {
        setTestStatus('testing');
        try {
            // We try to connect to the SSE endpoint. 
            // Since SSE is a stream, we just check if the initial request succeeds.
            const response = await fetch(`http://localhost:${mcpHttpPort}/mcp`);
            if (response.ok) {
                setTestStatus('success');
                setTimeout(() => setTestStatus('idle'), 3000);
            } else {
                setTestStatus('error');
            }
        } catch (e) {
            setTestStatus('error');
        }
    };

    useEffect(() => {
        getVersion().then(setAppVersion);
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-zinc-300 overflow-y-auto no-scrollbar">
            <div className="p-12 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative shadow-2xl">
                        <FiSettings size={24} className="text-zinc-500 animate-[spin_8s_linear_infinite]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Proxy Settings</h1>
                        <p className="text-zinc-500 text-xs font-medium tracking-wide uppercase mt-1">Configure your interception environment</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div
                        className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-all duration-300 cursor-pointer"
                        onClick={() => setShowConnectMethod(!showConnectMethod)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <FiTarget size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white mb-0.5">Show CONNECT Method</h3>
                                <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                                    Show HTTP CONNECT requests used to establish TLS tunnels. These are usually uninformative but can be useful for debugging proxies.
                                </p>
                            </div>
                        </div>

                        <button
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${showConnectMethod ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-zinc-800'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${showConnectMethod ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div
                        className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-all duration-300 cursor-pointer"
                        onClick={() => setStreamCertificateLogs(!streamCertificateLogs)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                                <FiTerminal size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white mb-0.5">Stream Certificate Logs</h3>
                                <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                                    Show real-time logs during certificate installation and removal. Useful for debugging why certificates fail to install.
                                </p>
                            </div>
                        </div>

                        <button
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${streamCertificateLogs ? 'bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-zinc-800'}`}
                        >
                        </button>
                    </div>

                    <div className="pt-8 border-t border-zinc-900 mt-12 pb-4">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            Model Context Protocol (MCP)
                        </h2>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mt-1">Enable LLM automation for your terminal & IDE</p>
                    </div>

                    <div
                        className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between group hover:border-purple-900/50 transition-all duration-300 cursor-pointer"
                        onClick={() => setMcpStdioEnabled(!mcpStdioEnabled)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                <FiCpu size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white mb-0.5">Enable MCP Stdio (Terminal)</h3>
                                <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                                    Allows CLI tools like <strong>Claude Code</strong> to launch the binary and interact directly via standard input/output.
                                </p>
                            </div>
                        </div>

                        <button
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${mcpStdioEnabled ? 'bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-zinc-800'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${mcpStdioEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div
                        className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between group hover:border-indigo-900/50 transition-all duration-300 cursor-pointer"
                        onClick={() => setMcpHttpEnabled(!mcpHttpEnabled)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                <FiCpu size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white mb-0.5">Enable MCP HTTP Streaming (Web)</h3>
                                <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                                    Exposes your traffic on <strong>http://localhost:3001/mcp</strong>. Perfect for <strong>TomioAI</strong> or browser-based AI agents.
                                </p>
                            </div>
                        </div>

                        <button
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${mcpHttpEnabled ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-zinc-800'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${mcpHttpEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {mcpHttpEnabled && (
                        <div className="ml-14 p-4 rounded-xl bg-indigo-900/10 border border-indigo-900/30 flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">HTTP Port</h4>
                                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">AI agents will connect to this port on localhost.</p>
                            </div>
                            <input
                                type="number"
                                value={mcpHttpPort}
                                onChange={(e) => setMcpHttpPort(parseInt(e.target.value) || 3001)}
                                className="w-24 bg-zinc-900 border border-indigo-900/50 rounded-lg px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                                min="1024"
                                max="65535"
                            />

                            <button
                                onClick={testMcpConnection}
                                disabled={testStatus === 'testing'}
                                className={`px-4 py-1.5 rounded-lg border flex items-center gap-2 transition-all duration-300 ml-2 ${testStatus === 'success' ? 'bg-green-600/20 border-green-500/50 text-green-400' :
                                    testStatus === 'error' ? 'bg-red-600/20 border-red-500/50 text-red-400' :
                                        'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95'
                                    }`}
                            >
                                {testStatus === 'testing' ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : testStatus === 'success' ? (
                                    <FiCheckCircle size={14} />
                                ) : testStatus === 'error' ? (
                                    <FiXCircle size={14} />
                                ) : (
                                    <FiPlay size={14} />
                                )}
                                <span className="text-[10px] uppercase font-black tracking-widest leading-none mt-0.5">
                                    {testStatus === 'testing' ? 'Testing...' :
                                        testStatus === 'success' ? 'Success' :
                                            testStatus === 'error' ? 'Failed' : 'Test'
                                    }
                                </span>
                            </button>
                        </div>
                    )}

                    <div className="p-8 rounded-2xl bg-gradient-to-br from-zinc-900/50 to-transparent border border-zinc-800/50 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Heads up</span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed italic">
                            By default, Network Spy filters out CONNECT requests to keep your traffic list clean and focused on actual application data. Enable this only if you specifically need to inspect the handshake process.
                        </p>
                    </div>
                </div>

                <div className="mt-24 pt-8 border-t border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                        <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Environment Synced</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-inner group">
                            <FiInfo size={14} className="text-zinc-600 group-hover:text-blue-500 transition-colors" />
                            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Version {appVersion}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
