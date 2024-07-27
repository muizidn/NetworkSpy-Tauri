import React from "react";
import { CertificateHelp, Tab } from "..";
import { AndroidDeviceInstaller } from "./AndroidDevice";
import { AndroidEmulatorInstaller } from "./AndroidEmulator";
import { iOSDeviceInstaller as _iOSDeviceInstaller } from "./iOSDevice";
import { iOSSimulatorInstaller as _iOSSimulatorInstaller } from "./iOSSimulator";

const Page: React.FC<{}> = () => {
  const tabs: Tab[] = [
    {
      id: "android-device",
      title: "Android Device",
      content: <AndroidDeviceInstaller />,
    },
    {
      id: "android-emulator",
      title: "Android Emulator",
      content: <AndroidEmulatorInstaller />,
    },
    {
      id: "iOS-device",
      title: "iOS Device",
      content: <_iOSDeviceInstaller />,
    },
    {
      id: "iOS-simulator",
      title: "iOS Simulator",
      content: <_iOSSimulatorInstaller />,
    },
    {
      id: "qnx-device",
      title: "QNX Device",
      content: <div>How to install in QNX Device</div>,
    },
    {
      id: "kaiOS-device",
      title: "KaiOS Device",
      content: <div>How to install in KaiOS Device</div>,
    },
    {
      id: "harmony-device",
      title: "Harmony OS Device",
      content: <div>How to install in Harmony OS Device</div>,
    },
  ];

  return <CertificateHelp tabs={tabs} />;
};

export default Page;
