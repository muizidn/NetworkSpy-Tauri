import { CertificateHelp } from "..";
import WebDocumentation from "../web";

const Page: React.FC<{}> = () => {
    return (
        <CertificateHelp tabs={[
            {
                id: "mac",
                title: "MacOS",
                content: <WebDocumentation url="https://www.google.com" />
            },
            {
                id: "windows",
                title: "Windows",
                content: <WebDocumentation url="https://www.bing.com" />
            },
            {
                id: "linux",
                title: "Linux",
                content: <WebDocumentation url="https://www.yahoo.com" />
            }
        ]} />
    )
}

export default Page;