import { CertificateHelp } from "..";
import { WindowsInstaller } from "./Windows";
import { MacOSInstaller } from "./Mac";
import { LinuxInstaller } from "./Linux";

const Page: React.FC<{}> = () => {
  return (
    <CertificateHelp
      tabs={[
        {
          id: "mac",
          title: "MacOS",
          content: <MacOSInstaller />,
        },
        {
          id: "windows",
          title: "Windows",
          content: <WindowsInstaller />,
        },
        {
          id: "linux",
          title: "Linux",
          content: <LinuxInstaller />,
        },
      ]}
    />
  );
};

export default Page;
