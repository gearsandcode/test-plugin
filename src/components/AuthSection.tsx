import React from 'react';
import type { GitHubAuthState } from '../types';

interface AuthSectionProps {
  auth: GitHubAuthState;
  onLogin: () => void;
  onLogout: () => void;
}

export function AuthSection({ auth, onLogin, onLogout }: AuthSectionProps) {
  if (auth.loading) {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-600">
            Authenticating with GitHub...
          </span>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="mb-6 p-4 bg-red-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Authentication Error
            </h3>
            <p className="mt-1 text-sm text-red-700">{auth.error}</p>
            <button
              onClick={onLogin}
              className="mt-2 text-sm text-red-700 underline hover:text-red-800"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!auth.token) {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col items-center justify-center">
          <svg
            className="h-8 w-8 text-gray-400 mb-2"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          <button
            onClick={onLogin}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                clipRule="evenodd"
              />
            </svg>
            Sign in with GitHub
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Authentication required to fetch repository information and create
            commits
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-green-50 rounded-lg">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
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
              Authenticated with GitHub
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {auth.type === 'app' ? 'GitHub App' : 'OAuth'}
              </span>
            </p>
            {auth.expiresAt && (
              <p className="mt-1 text-xs text-green-700">
                Session expires: {new Date(auth.expiresAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
