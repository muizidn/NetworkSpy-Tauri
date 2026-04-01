import { SiApple } from "react-icons/si";
import Guide, { GuideStep } from "../Guide";

export function MacOSInstaller() {
  const macOSSteps: GuideStep[] = [
    {
      title: "Download and Install NetworkSpy",
      description: (
        <div>
          <p>
            Visit the NetworkSpy website and download the installer for macOS:{" "}
            <a
              href="https://NetworkSpy.io"
              className="text-blue-400 hover:underline"
            >
              https://NetworkSpy.io
            </a>
          </p>
          <p className="mt-2">
            Open the downloaded file and drag the NetworkSpy app to your
            Applications folder.
          </p>
        </div>
      ),
    },
    {
      title: "Install Root NetworkSpy Certificate",
      description: (
        <div>
          <p>Open NetworkSpy and go to:</p>
          <p className="mt-2 font-medium">
            Preferences &gt; Certificates &gt; Install Certificate
          </p>
          <p className="mt-2">
            Follow the prompts to install the root certificate and ensure it is
            trusted by your system.
          </p>
          <div className="bg-zinc-900/50 p-4 rounded-md mt-2 flex items-center space-x-2 border border-zinc-800/50">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <span className="text-sm font-bold text-green-500">Installed & Trusted!</span>
          </div>
        </div>
      ),
    },
    {
      title: "Config Wifi Proxy on macOS",
      description: (
        <div>
          <p>
            Open <span className="font-bold text-zinc-200">System Preferences</span> &gt;{" "}
            <span className="font-bold text-zinc-200">Network</span>.
          </p>
          <p className="mt-4">
            Select your active network connection (Wi-Fi or Ethernet) and click
            <span className="font-bold text-zinc-200"> Advanced</span>.
          </p>
          <p className="mt-4 text-zinc-500">Go to the <span className="font-bold text-zinc-300">Proxies</span> tab and configure the following:</p>
          <div className="bg-zinc-900/50 p-6 rounded-xl mt-3 border border-zinc-800/50 space-y-3">
             <p className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
               <span className="text-zinc-500 text-xs">Web Proxy (HTTP):</span>
               <span className="font-mono text-xs text-blue-400">192.168.1.4 : 9090</span>
             </p>
             <p className="flex justify-between items-center">
               <span className="text-zinc-500 text-xs">Secure Web Proxy (HTTPS):</span>
               <span className="font-mono text-xs text-blue-400">192.168.1.4 : 9090</span>
             </p>
          </div>
          <p className="mt-4 text-[11px] text-zinc-500 italic leading-relaxed">
            Ensure <span className="font-bold text-zinc-400">Use Passive FTP Mode (PASV)</span> is unchecked. Click <span className="font-bold text-zinc-400">OK</span> and then <span className="font-bold text-zinc-400">Apply</span> to save.
          </p>
        </div>
      ),
    },
    {
      title: "Open Google Web Browser on macOS",
      description: (
        <div>
          <p>
            Visit Website:{" "}
            <a
              href="http://cert.NetworkSpy.io"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30"
            >
              http://cert.NetworkSpy.io
            </a>
          </p>
          <p className="mt-4 text-zinc-400">
            Let it install the 'NetworkSpy CA' certificate and follow the prompts.
          </p>
        </div>
      ),
    },
    {
      title: "Trust NetworkSpy Certificate in Keychain Access",
      description: (
        <div>
          <p className="leading-relaxed">
            Open <span className="text-zinc-200 font-bold italic underline">Keychain Access</span> and locate the <span className="text-blue-400 font-bold">NetworkSpy CA</span> certificate.
          </p>
          <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-xl mt-4">
              <p className="text-[12px] leading-relaxed text-zinc-300">
                Right-click &gt; <span className="font-black text-white">Get Info</span>. Expand <span className="font-black text-white">Trust</span> and set <span className="text-green-400 font-black">"Always Trust"</span>.
              </p>
          </div>
        </div>
      ),
    },
    {
      title: "Verify Proxy Configuration",
      description: (
        <div>
          <p>
            Open your web browser and navigate to{" "}
            <a
              href="http://example.com"
              className="text-blue-400 hover:underline"
            >
              http://example.com
            </a>{" "}
            to ensure the proxy settings are correctly configured.
          </p>
          <p className="mt-2">
            You should see the traffic being captured by NetworkSpy.
          </p>
        </div>
      ),
    },
  ];

  return (
    <Guide
      platform="macOS"
      icon={<SiApple size={32} />}
      steps={macOSSteps}
    />
  );
}
