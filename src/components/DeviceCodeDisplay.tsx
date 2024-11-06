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
        To connect your GitHub account, visit:
      </p>

      <a
        href={verificationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 font-medium block mb-4"
      >
        {verificationUrl}
      </a>

      <p className="text-sm text-gray-600 mb-2">And enter the code:</p>

      <div className="bg-gray-100 p-4 rounded-md text-center mb-4">
        <code className="text-lg font-mono font-bold text-gray-800">
          {userCode}
        </code>
      </div>

      <button
        onClick={() => {
          window.open(verificationUrl, '_blank');
        }}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Open GitHub
      </button>

      <p className="mt-4 text-xs text-gray-500 text-center">
        Waiting for authentication... You can close this window after
        authorizing on GitHub.
      </p>
    </div>
  );
}
