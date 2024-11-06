import React from 'react';
import type { RepoData } from '../types';

interface RepoInfoTabProps {
  loading: boolean;
  info: RepoData | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function RepoInfoTab({ loading, info, onSubmit }: RepoInfoTabProps) {
  return (
    <form onSubmit={onSubmit}>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading...' : 'Get Repository Info'}
      </button>

      {info && (
        <div className="mt-6 bg-white shadow overflow-hidden rounded-lg divide-y divide-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">
              Repository Details
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="text-sm text-gray-900">{info.repo.full_name}</dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">
                  Description
                </dt>
                <dd className="text-sm text-gray-900">
                  {info.repo.description || 'N/A'}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Language</dt>
                <dd className="text-sm text-gray-900">
                  {info.repo.language || 'N/A'}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">
                  Default Branch
                </dt>
                <dd className="text-sm text-gray-900">
                  {info.repo.default_branch}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">
                  Current Branch
                </dt>
                <dd className="text-sm text-gray-900">
                  {info.branch.name}
                  {info.branch.protected && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Protected
                    </span>
                  )}
                </dd>
              </div>

              <div className="flex justify-between items-center">
                <dt className="text-sm font-medium text-gray-500">
                  Latest Commit
                </dt>
                <dd className="text-sm text-gray-900">
                  <code className="px-2 py-1 bg-gray-100 rounded-md font-mono">
                    {info.branch.commit.sha.substring(0, 7)}
                  </code>
                </dd>
              </div>

              <div className="pt-4">
                <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">
                      {info.repo.stargazers_count.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Stars</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">
                      {info.repo.forks_count.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Forks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">
                      {info.repo.open_issues_count.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Issues</div>
                  </div>
                </div>
              </div>
            </dl>
          </div>
        </div>
      )}
    </form>
  );
}
