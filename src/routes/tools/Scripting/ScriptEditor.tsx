import React, { useState, useEffect } from "react";
import { FiSave, FiX, FiInfo } from "react-icons/fi";
import { ScriptingModel } from "./Scripting";
import { invoke } from "@tauri-apps/api/core";
import { Editor } from "@monaco-editor/react";

interface ScriptEditorProps {
  script?: ScriptingModel;
  onClose: () => void;
  onSave: () => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ script, onClose, onSave }) => {
  const [name, setName] = useState(script?.name || "New Script");
  const [matchingRule, setMatchingRule] = useState(script?.matchingRule || "*");
  const [method, setMethod] = useState(script?.method || "ALL");
  const [code, setCode] = useState(script?.script || `/**
 * Custom Traffic Interceptor Script
 * 
 * @param {Object} request - The HTTP request data
 * @param {Object} response - The HTTP response data (null for request-stage scripts)
 * 
 * Properties:
 * - request.headers: Object containing headers (e.g. request.headers["Authorization"])
 * - request.body: String containing the raw body
 * - request.method: String (GET, POST, etc.)
 * - request.uri: String (The full URL)
 * - response.statusCode: Number (e.g. 200, 404)
 * - response.headers: Object containing headers
 * - response.body: String containing the raw body
 * 
 * @returns {Object} - Must return { request, response } or modified object(s)
 */
function script(request, response) {
    // ---- 1. Modify Request Phase ----
    // You can inject headers, change method or even redirect the URL
    if (request.method === "POST") {
        request.headers["X-Modified-By"] = "NetworkSpy-Script";
    }

    // ---- 2. Modify Body Content ----
    // Search and replace content in JSON or text bodies
    if (request.uri.includes("/api/profile")) {
        try {
            let data = JSON.parse(request.body);
            data.user.role = "admin";
            request.body = JSON.stringify(data, null, 2);
        } catch(e) { /* Error parsing JSON */ }
    }

    // ---- 3. Modify Response Phase ----
    // This part runs ONLY if the script is set to Intercept Response
    if (response) {
        // Change status code
        if (response.statusCode === 404) {
            response.statusCode = 200;
        }

        // Apply a global header to all responses
        response.headers["X-Intercepted"] = "true";
    }

    // IMPORTANT: Always return the modified objects!
    return { request, response };
}
`);
  const [isRequest, setIsRequest] = useState(script?.request ?? true);
  const [isResponse, setIsResponse] = useState(script?.response ?? false);
  const [isEnabled, setIsEnabled] = useState(script?.enabled ?? true);

  const handleSave = async () => {
    try {
      const id = script?.id || crypto.randomUUID();
      await invoke("save_script", {
        rule: {
          id,
          enabled: isEnabled,
          name,
          method,
          matching_rule: matchingRule,
          script: code,
          request: isRequest,
          response: isResponse,
          error: null
        }
      });
      onSave();
    } catch (e) {
      console.error("Failed to save script:", e);
      alert("Failed to save script: " + e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-zinc-300">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#0d0d0d]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <FiCode size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none">
              {script ? "Edit Script" : "Create New Script"}
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-bold">
              Javascript Traffic Interceptor
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs flex items-center gap-2"
          >
            <FiX size={14} /> Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 transition-all text-xs font-bold flex items-center gap-2"
          >
            <FiSave size={14} /> Save Script
          </button>
        </div>
      </div>

      <div className="flex-grow flex min-h-0">
        <div className="w-[350px] border-r border-zinc-900 p-6 space-y-6 overflow-y-auto bg-[#080808]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">Script Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="e.g. Auth Token Injector"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">Matching URL Pattern</label>
              <input
                type="text"
                value={matchingRule}
                onChange={(e) => setMatchingRule(e.target.value)}
                className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="*/api/* or specific domain"
              />
              <p className="text-[9px] text-zinc-600 italic">Supports * and ? wildcards</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">HTTP Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-[#111111] border border-zinc-800 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors appearance-none"
              >
                <option value="ALL">ALL METHODS</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-900 space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">Execution Stages</label>
            <div className="space-y-3">
              <label className="flex items-center group cursor-pointer">
                <div className={twMerge(
                  "w-4 h-4 rounded border flex items-center justify-center transition-all mr-3",
                  isRequest ? "bg-amber-600 border-amber-500" : "bg-zinc-900 border-zinc-800"
                )}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isRequest}
                    onChange={() => setIsRequest(!isRequest)}
                  />
                  {isRequest && <FiCheck className="text-white" size={12} />}
                </div>
                <span className={twMerge("text-sm transition-colors", isRequest ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-400")}>intercept Request</span>
              </label>

              <label className="flex items-center group cursor-pointer">
                <div className={twMerge(
                  "w-4 h-4 rounded border flex items-center justify-center transition-all mr-3",
                  isResponse ? "bg-amber-600 border-amber-500" : "bg-zinc-900 border-zinc-800"
                )}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isResponse}
                    onChange={() => setIsResponse(!isResponse)}
                  />
                  {isResponse && <FiCheck className="text-white" size={12} />}
                </div>
                <span className={twMerge("text-sm transition-colors", isResponse ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-400")}>Intercept Response</span>
              </label>
            </div>
          </div>
          
          {script?.error && (
            <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-lg">
               <div className="flex items-start space-x-2">
                  <FiX className="text-red-400 mt-0.5" size={14} />
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-red-300 uppercase tracking-widest">Runtime Error</p>
                    <pre className="text-[10px] text-zinc-400 font-mono whitespace-pre-wrap mt-2 overflow-x-auto leading-relaxed">
                      {script.error}
                    </pre>
                  </div>
               </div>
            </div>
          )}

          <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-lg">
             <div className="flex items-start space-x-2">
                <FiInfo className="text-blue-400 mt-0.5" size={14} />
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-blue-300">Script variables:</p>
                  <ul className="text-[10px] text-zinc-400 space-y-1.5 font-mono">
                    <li>request.headers</li>
                    <li>request.body</li>
                    <li>request.method</li>
                    <li>request.uri</li>
                    <li className="pt-2">response.headers</li>
                    <li>response.body</li>
                    <li>response.statusCode</li>
                  </ul>
                  <p className="text-[9px] text-zinc-500 mt-4 italic">
                    The script must be a function named <code className="text-zinc-400 font-bold font-mono">script(request, response)</code> and should return an object containing the modified <code className="text-zinc-400 font-mono">request</code> and/or <code className="text-zinc-400 font-mono">response</code>.
                  </p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex-grow flex flex-col min-w-0 bg-[#050505]">
          <div className="flex-grow">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                bracketPairColorization: { enabled: true },
                automaticLayout: true,
                padding: { top: 20 }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
import { twMerge } from "tailwind-merge";
import { FiCode, FiCheck } from "react-icons/fi";
