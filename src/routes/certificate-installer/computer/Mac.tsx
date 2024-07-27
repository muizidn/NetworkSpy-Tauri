import Guide, { GuideStep } from "../Guide";

export function MacOSInstaller() {
  const macOSSteps: GuideStep[] = [
    {
      title: "Download and Install Proxyman",
      description: (
        <div>
          <p>
            Visit the Proxyman website and download the installer for macOS:{" "}
            <a
              href="https://proxyman.io"
              className="text-blue-400 hover:underline"
            >
              https://proxyman.io
            </a>
          </p>
          <p className="mt-2">
            Open the downloaded file and drag the Proxyman app to your
            Applications folder.
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
            Preferences &gt; Certificates &gt; Install Certificate
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
      title: "Config Wifi Proxy on macOS",
      description: (
        <div>
          <p>
            Open <span className="font-medium">System Preferences</span> &gt;{" "}
            <span className="font-medium">Network</span>.
          </p>
          <p className="mt-2">
            Select your active network connection (Wi-Fi or Ethernet) and click
            <span className="font-medium"> Advanced</span>.
          </p>
          <p className="mt-2">Go to the <span className="font-medium">Proxies</span> tab and configure the following:</p>
          <div className="bg-gray-800 p-4 rounded-md mt-2">
            <p>
              <span className="font-medium">Web Proxy (HTTP):</span> 192.168.1.4 port 9090
            </p>
            <p>
              <span className="font-medium">Secure Web Proxy (HTTPS):</span> 192.168.1.4 port 9090
            </p>
          </div>
          <p className="mt-2">
            Ensure <span className="font-medium">Use Passive FTP Mode (PASV)</span> is unchecked.
          </p>
          <p className="mt-2">Click <span className="font-medium">OK</span> and then <span className="font-medium">Apply</span> to save the changes.</p>
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
              href="http://cert.proxyman.io"
              className="text-blue-400 hover:underline"
            >
              http://cert.proxyman.io
            </a>
          </p>
          <p className="mt-2">
            Let it install the 'Proxyman CA' certificate and follow the prompts.
          </p>
          <p className="mt-2">
            If you could not download the certificate, please read the
            "Troubleshooting Page".
          </p>
        </div>
      ),
    },
    {
      title: "Trust Proxyman Certificate in Keychain Access",
      description: (
        <div>
          <p>
            Open <span className="font-medium">Keychain Access</span> from the
            Applications &gt; Utilities folder.
          </p>
          <p className="mt-2">
            In the left sidebar, select <span className="font-medium">System</span> and then <span className="font-medium">Certificates</span>.
          </p>
          <p className="mt-2">
            Find the Proxyman CA certificate, right-click on it, and select{" "}
            <span className="font-medium">Get Info</span>.
          </p>
          <p className="mt-2">
            Expand the <span className="font-medium">Trust</span> section and
            set <span className="font-medium">When using this certificate</span> to{" "}
            <span className="font-medium">Always Trust</span>.
          </p>
          <p className="mt-2">
            Close the window, and enter your password to confirm the changes.
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
      platform="macOS"
      emoji="https://emoji.gg/assets/emoji/7178-macos.png"
      steps={macOSSteps}
    />
  );
}
