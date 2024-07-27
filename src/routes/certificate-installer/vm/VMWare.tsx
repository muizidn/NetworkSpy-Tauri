import Guide, { GuideStep } from "../Guide";

export function VMWareInstaller() {
  const VMWareSteps: GuideStep[] = [
    {
      title: "Download and Install Proxyman",
      description: (
        <div>
          <p>
            Visit the Proxyman website and download the installer for VMWare:{" "}
            <a
              href="https://proxyman.io"
              className="text-blue-400 hover:underline"
            >
              https://proxyman.io
            </a>
          </p>
          <p className="mt-2">
            Open a terminal and navigate to the download directory. Run the
            following commands to install Proxyman:
          </p>
          <div className="bg-gray-800 p-4 rounded-md mt-2">
            <p>
              <code>sudo dpkg -i proxyman-setup.deb</code>
            </p>
            <p>
              <code>sudo apt-get install -f</code>
            </p>
          </div>
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
      title: "Config Proxy Settings on VMWare",
      description: (
        <div>
          <p>
            Open <span className="font-medium">Settings</span> &gt;{" "}
            <span className="font-medium">Network</span>.
          </p>
          <p className="mt-2">
            Select your active network connection and click
            <span className="font-medium"> Network Proxy</span>.
          </p>
          <p className="mt-2">Configure the following:</p>
          <div className="bg-gray-800 p-4 rounded-md mt-2">
            <p>
              <span className="font-medium">HTTP Proxy:</span> 192.168.1.4 port 9090
            </p>
            <p>
              <span className="font-medium">HTTPS Proxy:</span> 192.168.1.4 port 9090
            </p>
          </div>
          <p className="mt-2">
            Ensure <span className="font-medium">Use the same proxy for all protocols</span> is checked.
          </p>
          <p className="mt-2">Click <span className="font-medium">Apply</span> to save the changes.</p>
        </div>
      ),
    },
    {
      title: "Open Google Web Browser on VMWare",
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
      title: "Trust Proxyman Certificate in System Settings",
      description: (
        <div>
          <p>
            Open <span className="font-medium">System Settings</span> &gt;{" "}
            <span className="font-medium">Privacy & Security</span> &gt;{" "}
            <span className="font-medium">Certificates</span>.
          </p>
          <p className="mt-2">
            Add the Proxyman CA certificate to the list of trusted certificates.
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
      platform="VMWare"
      emoji="https://emoji.gg/assets/emoji/3855_VMWare.png"
      steps={VMWareSteps}
    />
  );
}
