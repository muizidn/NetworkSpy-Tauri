import { CertificateHelp, Tab } from '..';
import { SiPython, SiRuby, SiOpenjdk, SiNodedotjs, SiDotnet, SiPhp, SiGo, SiRust } from "react-icons/si";

const ComingSoon: React.FC<{ name: string; icon: React.ReactNode }> = ({ name, icon }) => (
    <div className="h-full flex items-center justify-center text-zinc-600 bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
            <div className="text-zinc-800">{icon}</div>
            <div className="text-sm font-bold uppercase tracking-widest text-zinc-800">{name} Integration Coming Soon</div>
        </div>
    </div>
);



const Page: React.FC<{}> = () => {
    const tabs: Tab[] = [
        {
            id: "python-runtime",
            title: "Python",
            icon: <SiPython className="text-blue-500" size={16} />,
            content: <ComingSoon name="Python" icon={<SiPython size={48} />} />
        },
        {
            id: "ruby-runtime",
            title: "Ruby",
            icon: <SiRuby className="text-red-500" size={16} />,
            content: <ComingSoon name="Ruby" icon={<SiRuby size={48} />} />
        },
        {
            id: "java-runtime",
            title: "Java",
            icon: <SiOpenjdk className="text-orange-600" size={16} />,
            content: <ComingSoon name="Java" icon={<SiOpenjdk size={48} />} />
        },
        {
            id: "nodejs-runtime",
            title: "Node.js",
            icon: <SiNodedotjs className="text-green-500" size={16} />,
            content: <ComingSoon name="Node.js" icon={<SiNodedotjs size={48} />} />
        },
        {
            id: "csharp-runtime",
            title: "C# (.NET)",
            icon: <SiDotnet className="text-purple-500" size={16} />,
            content: <ComingSoon name="C# (.NET)" icon={<SiDotnet size={48} />} />
        },
        {
            id: "php-runtime",
            title: "PHP",
            icon: <SiPhp className="text-blue-400" size={16} />,
            content: <ComingSoon name="PHP" icon={<SiPhp size={48} />} />
        },
        {
            id: "go-runtime",
            title: "Go (Golang)",
            icon: <SiGo className="text-cyan-500" size={16} />,
            content: <ComingSoon name="Go" icon={<SiGo size={48} />} />
        },
        {
            id: "rust-runtime",
            title: "Rust",
            icon: <SiRust className="text-orange-700" size={16} />,
            content: <ComingSoon name="Rust" icon={<SiRust size={48} />} />
        },
    ];

    return (
        <CertificateHelp title="Dev Environments" tabs={tabs} />
    );
}

export default Page;
