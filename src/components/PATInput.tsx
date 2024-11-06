import React, { useState } from 'react';

interface PATInputProps {
  onSubmit: (token: string) => void;
}

export function PATInput({ onSubmit }: PATInputProps) {
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onSubmit(token.trim());
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        GitHub Authentication
      </h2>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          To authenticate with GitHub, please provide a Personal Access Token
          (PAT).
        </p>
        <ol className="text-sm text-gray-600 list-decimal list-inside space-y-2">
          <li>
            Go to{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              GitHub Token Settings
            </a>
          </li>
          <li>Click "Generate new token" (classic)</li>
          <li>Give it a name (e.g., "Figma Plugin")</li>
          <li>
            Select the following scopes:
            <ul className="ml-6 mt-1 list-disc">
              <li>repo (Full control of private repositories)</li>
            </ul>
          </li>
          <li>Click "Generate token"</li>
          <li>Copy the token and paste it below</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="pat"
            className="block text-sm font-medium text-gray-700"
          >
            Personal Access Token
          </label>
          <input
            id="pat"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          />
        </div>

        <button
          type="submit"
          disabled={!token.trim()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                   bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                   disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Authenticate
        </button>
      </form>
    </div>
  );
}
