import React from 'react';
import { CertificateHelp, Tab } from '..'; // Assuming CertificateHelp component is imported from another file



const Page: React.FC<{}> = () => {
    // Define the tabs array containing information for each device
    const tabs: Tab[] = [
        {
            id: "docker-vm",
            title: "Docker Virtual Machine",
            content: <div>How to install in Docker Virtual Machine</div>
        },
        {
            id: "virtualbox-vm",
            title: "VirtualBox",
            content: <div>How to install in VirtualBox Virtual Machine</div>
        },
        {
            id: "vmware-vm",
            title: "VMware Virtual Machine",
            content: <div>How to install in VMware Virtual Machine</div>
        },
        {
            id: "kvm-vm",
            title: "KVM Virtual Machine",
            content: <div>How to install in KVM Virtual Machine</div>
        },
    ];

    return (
        <CertificateHelp tabs={tabs} />
    );
}

export default Page;
