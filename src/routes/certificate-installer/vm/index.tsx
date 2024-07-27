import React from 'react';
import { CertificateHelp, Tab } from '..';
import { DockerInstaller } from './Docker';
import { VirtualBoxInstaller } from './VirtualBox';
import { VMWareInstaller } from './VMWare';
import { KVMInstaller } from './KVM';



const Page: React.FC<{}> = () => {
    const tabs: Tab[] = [
        {
            id: "docker-vm",
            title: "Docker Virtual Machine",
            content: <DockerInstaller />
        },
        {
            id: "virtualbox-vm",
            title: "VirtualBox",
            content: <VirtualBoxInstaller />
        },
        {
            id: "vmware-vm",
            title: "VMware Virtual Machine",
            content: <VMWareInstaller />
        },
        {
            id: "kvm-vm",
            title: "KVM Virtual Machine",
            content: <KVMInstaller />
        },
    ];

    return (
        <CertificateHelp tabs={tabs} />
    );
}

export default Page;
