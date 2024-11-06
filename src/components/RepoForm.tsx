import React from 'react';

interface RepoFormProps {
  org: string;
  repo: string;
  branch: string;
  onOrgChange: (value: string) => void;
  onRepoChange: (value: string) => void;
  onBranchChange: (value: string) => void;
}

export function RepoForm({
  org,
  repo,
  branch,
  onOrgChange,
  onRepoChange,
  onBranchChange,
}: RepoFormProps) {
  return (
    <div className="space-y-4 mb-6">
      <div>
        <label
          htmlFor="org"
          className="block text-sm font-medium text-gray-700"
        >
          Organization
        </label>
        <input
          id="org"
          type="text"
          value={org}
          onChange={(e) => onOrgChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                   focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="e.g., microsoft"
        />
      </div>

      <div>
        <label
          htmlFor="repo"
          className="block text-sm font-medium text-gray-700"
        >
          Repository
        </label>
        <input
          id="repo"
          type="text"
          value={repo}
          onChange={(e) => onRepoChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                   focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="e.g., vscode"
        />
      </div>

      <div>
        <label
          htmlFor="branch"
          className="block text-sm font-medium text-gray-700"
        >
          Branch
        </label>
        <input
          id="branch"
          type="text"
          value={branch}
          onChange={(e) => onBranchChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                   focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="main"
        />
      </div>
    </div>
  );
}
