import React from "react";
import { CertificateHelp, Tab } from "..";
import { AndroidDeviceInstaller } from "./AndroidDevice";
import { AndroidEmulatorInstaller } from "./AndroidEmulator";
import { iOSDeviceInstaller as _iOSDeviceInstaller } from "./iOSDevice";
import { iOSSimulatorInstaller as _iOSSimulatorInstaller } from "./iOSSimulator";
import { SiAndroid, SiApple, SiGnometerminal, SiMicrostrategy, SiHuawei } from "react-icons/si";
import { HiOutlineDeviceMobile } from "react-icons/hi";

const Page: React.FC<{}> = () => {
  const tabs: Tab[] = [
    {
      id: "android-device",
      title: "Android Device",
      icon: <SiAndroid className="text-green-500" size={16} />,
      content: <AndroidDeviceInstaller />,
    },
    {
      id: "android-emulator",
      title: "Android Emulator",
      icon: <SiAndroid className="text-zinc-500" size={16} />,
      content: <AndroidEmulatorInstaller />,
    },
    {
      id: "iOS-device",
      title: "iOS Device",
      icon: <SiApple className="text-white" size={16} />,
      content: <_iOSDeviceInstaller />,
    },
    {
      id: "iOS-simulator",
      title: "iOS Simulator",
      icon: <SiApple className="text-zinc-500" size={16} />,
      content: <_iOSSimulatorInstaller />,
    },
    {
      id: "qnx-device",
      title: "QNX Device",
      icon: <SiMicrostrategy className="text-red-500" size={16} />,
      content: (
        <div className="h-full flex items-center justify-center text-zinc-600 bg-[#050505]">
          <div className="flex flex-col items-center gap-4">
              <SiMicrostrategy size={48} />
              <div className="text-sm font-bold uppercase tracking-widest text-zinc-800">QNX Module Coming Soon</div>
          </div>
        </div>
      ),
    },
    {
      id: "kaiOS-device",
      title: "KaiOS Device",
      icon: <SiGnometerminal className="text-yellow-600" size={16} />,
      content: (
        <div className="h-full flex items-center justify-center text-zinc-600 bg-[#050505]">
          <div className="flex flex-col items-center gap-4">
              <SiGnometerminal size={48} />
              <div className="text-sm font-bold uppercase tracking-widest text-zinc-800">KaiOS Module Coming Soon</div>
          </div>
        </div>
      ),
    },
    {
      id: "harmony-device",
      title: "Harmony OS Device",
      icon: <SiHuawei className="text-red-600" size={16} />,
      content: (
        <div className="h-full flex items-center justify-center text-zinc-600 bg-[#050505]">
          <div className="flex flex-col items-center gap-4">
              <SiHuawei size={48} />
              <div className="text-sm font-bold uppercase tracking-widest text-zinc-800">HarmonyOS Module Coming Soon</div>
          </div>
        </div>
      ),
    },
  ];

  return <CertificateHelp title="Mobile Platforms" tabs={tabs} />;
};

export default Page;
