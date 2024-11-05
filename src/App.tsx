import React, { useState, useEffect } from 'react';
import type { RepoInfo, BranchInfo } from './types';

interface RepoData {
  repo: RepoInfo;
  branch: BranchInfo;
}

function App(): JSX.Element {
  const [org, setOrg] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<RepoData | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const message = event.data.pluginMessage;
      if (message.type === 'repo-info') {
        setInfo(message.data);
        setLoading(false);
      } else if (message.type === 'error') {
        setError(message.message);
        setLoading(false);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    parent.postMessage({
      pluginMessage: {
        type: 'fetch-repo',
        org,
        repo,
        branch
      }
    }, '*');
  }

  return (
    <div className="w-full min-h-screen bg-white antialiased">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">
          GitHub Repository Info
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="org" className="block text-sm font-medium text-gray-700">
                Organization
              </label>
              <input
                id="org"
                type="text"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                         focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., microsoft"
              />
            </div>

            <div>
              <label htmlFor="repo" className="block text-sm font-medium text-gray-700">
                Repository
              </label>
              <input
                id="repo"
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                         focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., vscode"
              />
            </div>

            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                Branch
              </label>
              <input
                id="branch"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                         focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="main"
              />
              <p className="mt-1 text-sm text-gray-500">
                Defaults to 'main' if left empty
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !org || !repo}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                     bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Loading...</span>
            ) : (
              'Get Repository Info'
            )}
          </button>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {info && (
            <div className="mt-6 bg-white shadow overflow-hidden rounded-lg divide-y divide-gray-200">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900">Repository Details</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="text-sm text-gray-900">{info.repo.full_name}</dd>
                  </div>
                  
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="text-sm text-gray-900">{info.repo.description || 'N/A'}</dd>
                  </div>
                  
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Language</dt>
                    <dd className="text-sm text-gray-900">{info.repo.language || 'N/A'}</dd>
                  </div>
                  
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Default Branch</dt>
                    <dd className="text-sm text-gray-900">{info.repo.default_branch}</dd>
                  </div>
                  
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Current Branch</dt>
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
                    <dt className="text-sm font-medium text-gray-500">Latest Commit</dt>
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
      </div>
    </div>
  );
}

export default App;