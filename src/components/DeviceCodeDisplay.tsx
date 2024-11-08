import React from 'react';

interface DeviceCodeDisplayProps {
  userCode: string;
  verificationUrl: string;
}

export function DeviceCodeDisplay({
  userCode,
  verificationUrl,
}: DeviceCodeDisplayProps) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Connect to GitHub
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Your browser should open automatically to GitHub. If it doesn't, visit:
      </p>

      <a
        href={verificationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 font-medium block mb-4"
      >
        {verificationUrl}
      </a>

      <p className="text-sm text-gray-600 mb-2">And enter this code:</p>

      <div className="bg-gray-100 p-4 rounded-md text-center mb-4">
        <code className="text-xl font-mono font-bold tracking-wide text-gray-800">
          {userCode}
        </code>
      </div>

      <p className="text-sm text-gray-500 text-center">
        Waiting for authentication... You can close this window after
        authorizing on GitHub.
      </p>
    </div>
  );
}
