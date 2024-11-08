import React from 'react';
import type { GitHubAuthState } from '../types';

interface CommitTabProps {
  loading: boolean;
  authStatus: GitHubAuthState;
  org: string;
  repo: string;
  branch: string;
  filePath: string;
  fileContent: string;
  commitMessage: string;
  onFilePathChange: (value: string) => void;
  onFileContentChange: (value: string) => void;
  onCommitMessageChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  commitSuccess: { sha: string; url: string } | null;
}

export function CommitTab({
  loading,
  authStatus,
  org,
  repo,
  branch,
  filePath,
  fileContent,
  commitMessage,
  onFilePathChange,
  onFileContentChange,
  onCommitMessageChange,
  onSubmit,
  commitSuccess,
}: CommitTabProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="filePath"
            className="block text-sm font-medium text-gray-700"
          >
            File Path
          </label>
          <input
            id="filePath"
            type="text"
            value={filePath}
            onChange={(e) => onFilePathChange(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="path/to/file.json"
          />
        </div>

        <div>
          <label
            htmlFor="fileContent"
            className="block text-sm font-medium text-gray-700"
          >
            File Content
          </label>
          <textarea
            id="fileContent"
            value={fileContent}
            onChange={(e) => onFileContentChange(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter file content..."
          />
        </div>

        <div>
          <label
            htmlFor="commitMessage"
            className="block text-sm font-medium text-gray-700"
          >
            Commit Message
          </label>
          <input
            id="commitMessage"
            type="text"
            value={commitMessage}
            onChange={(e) => onCommitMessageChange(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Update design from Figma"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={
          loading ||
          !authStatus?.token ||
          !org ||
          !repo ||
          !filePath ||
          !fileContent ||
          !commitMessage
        }
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating PR...' : 'Create Pull Request'}
      </button>

      {commitSuccess && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Commit created successfully!{' '}
                <a
                  href={commitSuccess.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-green-900"
                >
                  View changes (SHA: {commitSuccess.sha.substring(0, 7)})
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
