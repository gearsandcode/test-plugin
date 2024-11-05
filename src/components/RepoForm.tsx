import React, { useState } from 'react';
import { fetchRepoInfo } from '../api';
import type { RepoInfo, BranchInfo, ApiError } from '../types';
import RepoDetails from './RepoDetails';

const RepoForm: React.FC = () => {
  const [org, setOrg] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{
    repo: RepoInfo;
    branch: BranchInfo;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org.trim() || !repo.trim()) {
      setError('Organization and repository names are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchRepoInfo(
        org.trim(),
        repo.trim(),
        branch.trim() || 'main'
      );
      setInfo(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      parent.postMessage(
        {
          pluginMessage: {
            type: 'error',
            message: apiError.message,
          },
        },
        '*'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization
          </label>
          <input
            type="text"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., microsoft"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Repository
          </label>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., vscode"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Branch
          </label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="main"
          />
          <p className="mt-1 text-sm text-gray-500">
            Defaults to 'main' if left empty
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">Loading...</span>
          ) : (
            'Get Repository Info'
          )}
        </button>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {info && <RepoDetails repo={info.repo} branch={info.branch} />}
      </form>
    </div>
  );
};

export default RepoForm;
