import React from 'react';
import { FiShield, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import { Button } from './Button';
import { invoke } from '@tauri-apps/api/core';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({
  isOpen,
  onClose,
  onAcknowledge,
}) => {
  if (!isOpen) return null;

  const handleGoToCertInstaller = async () => {
    try {
      if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
        await invoke("open_new_window", { 
          context: "certificate-installer", 
          title: "Certificate Installer" 
        });
      } else {
        console.log("Mock: Opening Certificate Installer window");
      }
      onClose(); // Just close, don't mark as acknowledged yet.
    } catch (err) {
      console.error("Failed to open certificate installer", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity cursor-pointer"
      />

      {/* dialog */}
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-zinc-800/50 rounded-3xl shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-gradient-x" />
        
        <div className="p-10 flex flex-col items-center text-center">
          <div className="mb-8 relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
            <img 
              src="/network-spy-logo.png" 
              alt="NetworkSpy Logo" 
              className="relative w-28 h-28 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            />
          </div>

          <h3 className="text-3xl font-black text-white mb-4 tracking-tight">
            Welcome to NetworkSpy
          </h3>

          <p className="text-zinc-400 text-base leading-relaxed mb-8 max-w-md">
            To start intercepting and analyzing HTTPS traffic, you need to install our trusted certificate. 
            <span className="block mt-4 text-amber-400 font-bold flex items-center justify-center gap-2">
              <FiAlertTriangle size={18} />
              Important: Internet may be blocked if proxy is enabled without the certificate!
            </span>
          </p>

          <div className="flex flex-col w-full gap-3">
            <Button
              title="INSTALL CERTIFICATE NOW"
              onClick={handleGoToCertInstaller}
              className="w-full py-4 h-auto text-[12px] font-black tracking-[0.2em] bg-blue-600 hover:bg-blue-500 text-white border-none rounded-2xl shadow-xl shadow-blue-900/20 group"
            >
              <div className="flex items-center justify-center gap-2">
                INSTALL CERTIFICATE NOW
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>
            
            <button
              onClick={onClose}
              className="w-full py-2 text-[11px] font-bold tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              I'LL DO IT LATER
            </button>

            <button
              onClick={onAcknowledge}
              className="w-full py-1 text-[9px] font-medium tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors opacity-50 uppercase"
            >
              Don't show this again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
