import React from 'react';

export interface GuideStep {
  title: string;
  description: string | JSX.Element;
  codeBlocks?: { fileName: string, code: string }[];
}

interface GuideProps {
  platform: string;
  steps: GuideStep[];
  emoji: string;
}

const Guide: React.FC<GuideProps> = ({ platform, steps, emoji }) => {
  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen flex items-center justify-center overflow-auto">
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold flex items-center mb-8">
          <img src={emoji} alt="Platform emoji" className="w-8 h-8 mr-2" />
          {platform} Setup Guide
        </h1>
        <ol className="list-decimal list-inside space-y-6">
          {steps.map((step, index) => (
            <li key={index}>
              <h2 className="font-semibold text-lg">{step.title}</h2>
              <div className="mt-2">{step.description}</div>
              {step.codeBlocks?.map((block, blockIndex) => (
                <div key={blockIndex} className="mt-2">
                  <p><code className="bg-gray-800 p-1 rounded">{block.fileName}</code></p>
                  <pre className="bg-gray-800 p-4 rounded-md mt-2 text-sm overflow-x-auto">
                    <code>{block.code}</code>
                  </pre>
                </div>
              ))}
            </li>
          ))}
        </ol>
        <div className="mt-8 space-x-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">Sample {platform} Project</button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">Troubleshooting</button>
        </div>
      </div>
    </div>
  );
};

export default Guide;