import React from 'react';

interface WebDocumentationProps {
    url: string;
}

const WebDocumentation: React.FC<WebDocumentationProps> = ({ url }) => {
    return (
        <iframe src={url} className="w-full h-full" height="100%" frameBorder="0"></iframe>
    );
}

export default WebDocumentation;
