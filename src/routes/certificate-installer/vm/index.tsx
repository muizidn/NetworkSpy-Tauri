import React from 'react';
import { CertificateHelp, Tab } from '..';
import { DockerInstaller } from './Docker';
import { VirtualBoxInstaller } from './VirtualBox';
import { VMWareInstaller } from './VMWare';
import { KVMInstaller } from './KVM';
import { SiDocker, SiVirtualbox, SiVmware } from "react-icons/si";
import { FiMonitor } from "react-icons/fi";



const Page: React.FC<{}> = () => {
    const tabs: Tab[] = [
        {
            id: "docker-vm",
            title: "Docker VM",
            icon: <SiDocker className="text-blue-400" size={16} />,
            content: <DockerInstaller />
        },
        {
            id: "virtualbox-vm",
            title: "VirtualBox",
            icon: <SiVirtualbox className="text-blue-300" size={16} />,
            content: <VirtualBoxInstaller />
        },
        {
            id: "vmware-vm",
            title: "VMware",
            icon: <SiVmware className="text-zinc-400" size={16} />,
            content: <VMWareInstaller />
        },
        {
            id: "kvm-vm",
            title: "KVM",
            icon: <FiMonitor className="text-orange-500" size={16} />,
            content: <KVMInstaller />
        },
    ];

    return (
        <CertificateHelp title="Virtual Environments" tabs={tabs} />
    );
}

export default Page;
