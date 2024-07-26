import React from 'react';
import { CertificateHelp, Tab } from '..'; // Assuming CertificateHelp component is imported from another file



const Page: React.FC<{}> = () => {
    const tabs: Tab[] = [
        {
            id: "android-device",
            title: "Android Device",
            content: <div>How to install in Android Physical Device</div>
        },
        {
            id: "ios-device",
            title: "iOS Device",
            content: <div>How to install in iOS Physical Device</div>
        },
        {
            id: "ios-simulator",
            title: "iOS Simulator",
            content: <div>How to install in iOS Simulator</div>
        },
        {
            id: "android-emulator",
            title: "Android Emulator",
            content: <div>How to install in Android Emulator</div>
        },
        {
            id: "qnx-device",
            title: "QNX Device",
            content: <div>How to install in QNX Device</div>
        },
        {
            id: "kaios-device",
            title: "KaiOS Device",
            content: <div>How to install in KaiOS Device</div>
        },
        {
            id: "harmony-device",
            title: "Harmony OS Device",
            content: <div>How to install in Harmony OS Device</div>
        },
    ];

    return (
        <CertificateHelp tabs={tabs} />
    );
}

export default Page;
