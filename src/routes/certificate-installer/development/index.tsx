import React from 'react';
import { CertificateHelp, Tab } from '..';



const Page: React.FC<{}> = () => {
    const tabs: Tab[] = [
        {
            id: "python-runtime",
            title: "Python",
            content: <div>How to set up and run Python applications</div>
        },
        {
            id: "ruby-runtime",
            title: "Ruby",
            content: <div>How to set up and run Ruby applications</div>
        },
        {
            id: "java-runtime",
            title: "Java",
            content: <div>How to set up and run Java applications</div>
        },
        {
            id: "nodejs-runtime",
            title: "Node.js",
            content: <div>How to set up and run Node.js applications</div>
        },
        {
            id: "csharp-runtime",
            title: "C# (.NET)",
            content: <div>How to set up and run C# applications with .NET Framework or .NET Core</div>
        },
        {
            id: "php-runtime",
            title: "PHP",
            content: <div>How to set up and run PHP applications</div>
        },
        {
            id: "go-runtime",
            title: "Go (Golang)",
            content: <div>How to set up and run Go applications</div>
        },
        {
            id: "rust-runtime",
            title: "Rust",
            content: <div>How to set up and run Rust applications</div>
        },
    ];

    return (
        <CertificateHelp tabs={tabs} />
    );
}

export default Page;
