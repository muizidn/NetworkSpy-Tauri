import Guide, { GuideStep } from "../Guide";

export function WindowsInstaller() {
  const windowsSteps: GuideStep[] = [
    {
      title: "Download and Install Proxyman",
      description: (
        <div>
          <p>
            Visit the Proxyman website and download the installer for Windows:{" "}
            <a
              href="https://proxyman.io"
              className="text-blue-400 hover:underline"
            >
              https://proxyman.io
            </a>
          </p>
          <p className="mt-2">
            Run the installer and follow the on-screen instructions to install
            Proxyman on your Windows machine.
          </p>
        </div>
      ),
    },
    {
      title: "Install Root Proxyman Certificate",
      description: (
        <div>
          <p>Open Proxyman and go to:</p>
          <p className="mt-2 font-medium">
            Certificates &gt; Install Certificate
          </p>
          <p className="mt-2">
            Follow the prompts to install the root certificate and ensure it is
            trusted by your system.
          </p>
          <div className="bg-gray-800 p-4 rounded-md mt-2 flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Installed & Trusted!</span>
          </div>
        </div>
      ),
    },
    {
      title: "Config Proxy Settings on Windows",
      description: (
        <div>
          <p>
            Open <span className="font-medium">Settings</span> &gt;{" "}
            <span className="font-medium">Network & Internet</span> &gt;{" "}
            <span className="font-medium">Proxy</span>.
          </p>
          <p className="mt-2">Under <span className="font-medium">Manual proxy setup</span>, configure the following:</p>
          <div className="bg-gray-800 p-4 rounded-md mt-2">
            <p>
              <span className="font-medium">Address:</span> 192.168.1.4
            </p>
            <p>
              <span className="font-medium">Port:</span> 9090
            </p>
          </div>
          <p className="mt-2">
            Ensure <span className="font-medium">Use a proxy server</span> is turned on, and save the changes.
          </p>
        </div>
      ),
    },
    {
      title: "Open Google Web Browser on Windows",
      description: (
        <div>
          <p>
            Visit Website:{" "}
            <a
              href="http://cert.proxyman.io"
              className="text-blue-400 hover:underline"
            >
              http://cert.proxyman.io
            </a>
          </p>
          <p className="mt-2">
            Let it install the 'Proxyman CA' certificate and follow the
            prompts.
          </p>
          <p className="mt-2">
            If you could not download the certificate, please read the
            "Troubleshooting Page".
          </p>
        </div>
      ),
    },
    {
      title: "Trust Proxyman Certificate in Settings",
      description: (
        <div>
          <p>
            Open <span className="font-medium">Control Panel</span> &gt;{" "}
            <span className="font-medium">Internet Options</span> &gt;{" "}
            <span className="font-medium">Content</span> tab &gt;{" "}
            <span className="font-medium">Certificates</span>.
          </p>
          <p className="mt-2">
            Select the <span className="font-medium">Trusted Root Certification Authorities</span> tab and verify that the
            Proxyman Certificate is listed and trusted.
          </p>
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
            You should see the traffic being captured by Proxyman.
          </p>
        </div>
      ),
    },
  ];

  return (
    <Guide
      platform="Windows"
      emoji="https://emoji.gg/assets/emoji/4860_windows.png"
      steps={windowsSteps}
    />
  );
}
