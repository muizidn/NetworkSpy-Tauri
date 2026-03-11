import React from "react";
import { CertificateHelp } from "..";
import { WindowsInstaller } from "./Windows";
import { MacOSInstaller } from "./Mac";
import { LinuxInstaller } from "./Linux";
import { SiApple, SiWindows, SiLinux } from "react-icons/si";

const Page: React.FC<{}> = () => {
  return (
    <CertificateHelp
      title="Desktop Systems"
      tabs={[
        {
          id: "mac",
          title: "MacOS",
          content: <MacOSInstaller />,
          icon: <SiApple size={16} className="text-white" />,
        },
        {
          id: "windows",
          title: "Windows",
          content: <WindowsInstaller />,
          icon: <SiWindows size={16} className="text-blue-400" />,
        },
        {
          id: "linux",
          title: "Linux",
          content: <LinuxInstaller />,
          icon: <SiLinux size={16} className="text-yellow-500" />,
        },
      ]}
    />
  );
};

export default Page;
