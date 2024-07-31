import { CertificateHelp } from "..";
import { WindowsInstaller } from "./Windows";
import { MacOSInstaller } from "./Mac";
import { LinuxInstaller } from "./Linux";
import { Apple, Windows } from "iconsax-react";

const Page: React.FC<{}> = () => {
  return (
    <CertificateHelp
      tabs={[
        {
          id: "mac",
          title: "MacOS",
          content: <MacOSInstaller />,
          icon: <Apple size='32' className='pr-1' />,
        },
        {
          id: "windows",
          title: "Windows",
          content: <WindowsInstaller />,
          icon: <Windows size='32' className='pr-1' />,
        },
        {
          id: "linux",
          title: "Linux",
          content: <LinuxInstaller />,
          icon: <Windows size='32' className='pr-1' />,
        },
      ]}
    />
  );
};

export default Page;
