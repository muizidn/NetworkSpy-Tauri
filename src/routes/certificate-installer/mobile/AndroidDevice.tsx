import { SiAndroid } from "react-icons/si";
import Guide, { GuideStep } from "../Guide";

export function AndroidDeviceInstaller() {
  // Example usage for Android
  const androidSteps: GuideStep[] = [
    {
      title: "Install Root NetworkSpy Certificate to this Mac",
      description: (
        <div className="bg-zinc-900/50 p-4 rounded-md mt-2 flex items-center space-x-2 border border-zinc-800/50">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <span className="text-sm font-bold text-green-500">Installed & Trusted!</span>
        </div>
      ),
    },
    {
      title: "Config Wifi Proxy on Android device to NetworkSpy",
      description: (
        <div>
          <p>
            Open:{" "}
            <span className="font-bold text-zinc-200">
              Settings app &gt; Wi-Fi &gt; Select current Wi-Fi &gt; Configure
              Proxy
            </span>
          </p>
          <p className="mt-4 text-zinc-500">Config with the following info:</p>
          <div className="bg-zinc-900/50 p-6 rounded-xl mt-3 border border-zinc-800/50 space-y-3">
            <p className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
              <span className="text-zinc-500">Server:</span>
              <span className="font-mono text-blue-400">192.168.1.4</span>
            </p>
            <p className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
              <span className="text-zinc-500">Port:</span>
              <span className="font-mono text-blue-400">9090</span>
            </p>
            <p className="flex justify-between items-center">
              <span className="text-zinc-500">Authentication:</span>
              <span className="text-zinc-300">No</span>
            </p>
          </div>
          <p className="mt-4 text-[11px] text-zinc-500 italic">
            Make sure to turn OFF all VPNs from your Macbook and Android
            devices.
          </p>
        </div>
      ),
    },
    {
      title: "Open Google Web Browser on Android devices",
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
          <p className="mt-4">
            Let install the 'NetworkSpy CA' certificate and Select <span className="text-zinc-300 font-bold">VPN and App</span> Section
          </p>
        </div>
      ),
    },
    {
      title: "Trust NetworkSpy Certificate in Setting app (Android 11 later)",
      description: (
        <div>
          <p className="mb-4">
            Open <span className="text-zinc-200 font-bold">Setting app &gt; Security &gt; Encryption & Credentials &gt; Install a Certificate &gt; CA Certificate</span>
          </p>
          <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl">
              <p className="text-[12px] leading-relaxed">
                Select <span className="text-blue-400 font-bold">"Install Anyway"</span> and select <span className="text-blue-400 font-bold">"CA NetworkSpy Certificate"</span> that
                you downloaded from Step 3.
              </p>
          </div>
          <p className="mt-4 text-zinc-500">
            Verify that NetworkSpy Certificate is on Trusted Credentials -&gt;
            User Tab
          </p>
        </div>
      ),
    },
    {
      title:
        "Add NetworkSpy Configs to your Android project (Android 10 or later)",
      description: (
        <div>
          <p>
            Add{" "}
            <code className="bg-gray-800 p-1 rounded">
              res/xml/network_security_config.xml
            </code>
          </p>
        </div>
      ),
      codeBlocks: [
        {
          fileName: "res/xml/network_security_config.xml",
          code: `
  <network-security-config>
    <debug-overrides>
      <trust-anchors>
        <!-- Trust user added CAs while debuggable only -->
        <certificates src="user" />
        <certificates src="system" />
      </trust-anchors>
    </debug-overrides>
  </network-security-config>`,
        },
        {
          fileName: "AndroidManifest.xml",
          code: `
  <manifest>
    <application
      android:networkSecurityConfig="@xml/network_security_config">
    </application>
  </manifest>`,
        },
      ],
    },
  ];

  return (
    <Guide
      platform="Android"
      icon={<SiAndroid size={32} />}
      steps={androidSteps}
    />
  );
};
