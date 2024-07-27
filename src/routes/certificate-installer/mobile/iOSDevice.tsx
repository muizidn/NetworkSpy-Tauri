import Guide, { GuideStep } from "../Guide";

export function iOSDeviceInstaller() {
  // Example usage for Android
  const androidSteps: GuideStep[] = [
    {
      title: "Install Root Proxyman Certificate to this Mac",
      description: (
        <div className="bg-gray-800 p-4 rounded-md mt-2 flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Installed & Trusted!</span>
        </div>
      ),
    },
    {
      title: "Config Wifi Proxy on Android device to Proxyman",
      description: (
        <div>
          <p>
            Open:{" "}
            <span className="font-medium">
              Settings app &gt; Wi-Fi &gt; Select current Wi-Fi &gt; Configure
              Proxy
            </span>
          </p>
          <p className="mt-2">Config with the following info:</p>
          <div className="bg-gray-800 p-4 rounded-md mt-2">
            <p>
              <span className="font-medium">Server:</span> 192.168.1.4
            </p>
            <p>
              <span className="font-medium">Port:</span> 9090
            </p>
            <p>
              <span className="font-medium">Authentication:</span> No
            </p>
          </div>
          <p className="mt-2">
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
              href="http://cert.proxyman.io"
              className="text-blue-400 hover:underline"
            >
              http://cert.proxyman.io
            </a>
          </p>
          <p className="mt-2">
            Let install the 'Proxyman CA' certificate and Select VPN and App
            Section
          </p>
          <p className="mt-2">
            If you could not download the certificate, please read
            "Troubleshooting Page"
          </p>
        </div>
      ),
    },
    {
      title: "Trust Proxyman Certificate in Setting app (Android 11 later)",
      description: (
        <div>
          <p>
            Open Setting app &gt; Security &gt; Encryption & Credentials &gt;
            Install a Certificate &gt; CA Certificate
          </p>
          <p className="mt-2">
            Select "Install Anyway" and select "CA Proxyman Certificate" that
            you downloaded from Step 3
          </p>
          <p className="mt-2">
            Verify that Proxyman Certificate is on Trusted Credentials -&gt;
            User Tab
          </p>
        </div>
      ),
    },
    {
      title:
        "Add Proxyman Configs to your Android project (Android 10 or later)",
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
      emoji="https://emoji.gg/assets/emoji/4860_android.png"
      steps={androidSteps}
    />
  );
};
