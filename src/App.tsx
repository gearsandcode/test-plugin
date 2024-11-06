import React, { useState, useEffect } from 'react';
import type {
  RepoData,
  CommitFile,
  GitHubAuthState,
  PluginMessage,
} from './types';
import { TabNavigation } from './components/TabNavigation';
import { RepoForm } from './components/RepoForm';
import { RepoInfoTab } from './components/RepoInfoTab';
import { CommitTab } from './components/CommitTab';
import { AuthSection } from './components/AuthSection';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { DeviceCodeDisplay } from './components/DeviceCodeDisplay';
import { PATInput } from './components/PATInput';

function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'info' | 'commit'>('info');
  const [org, setOrg] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<RepoData | null>(null);
  const [showPATInput, setShowPATInput] = useState(false);

  // Auth state
  const [auth, setAuth] = useState<GitHubAuthState>({
    token: null,
    expiresAt: null,
    type: null,
    error: null,
    loading: false,
  });

  // Device code state
  const [deviceCode, setDeviceCode] = useState<{
    userCode: string;
    verificationUrl: string;
  } | null>(null);

  // File commit state
  const [filePath, setFilePath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [commitSuccess, setCommitSuccess] = useState<{
    sha: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    function handleMessage(
      event: MessageEvent<{ pluginMessage: PluginMessage }>
    ) {
      const message = event.data.pluginMessage;
      if (!message) return;

      switch (message.type) {
        case 'repo-info':
          setInfo(message.data);
          setLoading(false);
          break;

        case 'auth-success':
          setAuth((prev) => ({
            ...prev,
            token: message.token,
            expiresAt: message.expiresAt,
            type: message.authType,
            error: null,
            loading: false,
          }));
          setDeviceCode(null); // Clear device code on successful auth
          break;

        case 'auth-error':
          setAuth((prev) => ({
            ...prev,
            token: null,
            error: message.error,
            loading: false,
          }));
          setDeviceCode(null);
          break;

        case 'show-device-code':
          setDeviceCode(message.data);
          setAuth((prev) => ({
            ...prev,
            loading: true,
          }));
          break;

        case 'commit-success':
          setCommitSuccess(message.data);
          setLoading(false);
          setError(null);
          break;

        case 'error':
          setError(message.message);
          setLoading(false);
          break;

        case 'show-pat-input':
          setShowPATInput(true);
          setAuth((prev) => ({
            ...prev,
            loading: false,
          }));
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = () => {
    setAuth((prev) => ({ ...prev, loading: true, error: null }));
    parent.postMessage(
      {
        pluginMessage: { type: 'initiate-github-auth' },
      },
      '*'
    );
  };

  const handleLogout = () => {
    parent.postMessage(
      {
        pluginMessage: { type: 'logout' },
      },
      '*'
    );
    setAuth({
      token: null,
      expiresAt: null,
      type: null,
      error: null,
      loading: false,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    parent.postMessage(
      {
        pluginMessage: {
          type: 'fetch-repo',
          org,
          repo,
          branch,
        },
      },
      '*'
    );
  };

  const handleCommit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.token) {
      setError('Authentication not available');
      return;
    }

    setLoading(true);
    setError(null);
    setCommitSuccess(null);

    const commitData: CommitFile = {
      path: filePath,
      content: fileContent,
      message: commitMessage,
    };

    parent.postMessage(
      {
        pluginMessage: {
          type: 'create-commit',
          org,
          repo,
          branch,
          file: commitData,
          auth: auth,
        },
      },
      '*'
    );
  };

  const handlePATSubmit = (token: string) => {
    parent.postMessage(
      {
        pluginMessage: {
          type: 'submit-pat',
          token,
        },
      },
      '*'
    );
    setShowPATInput(false);
    setAuth((prev) => ({
      ...prev,
      loading: true,
    }));
  };

  // Show device code screen if available
  if (deviceCode) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center p-6">
        <DeviceCodeDisplay
          userCode={deviceCode.userCode}
          verificationUrl={deviceCode.verificationUrl}
        />
      </div>
    );
  }

  // Show loading spinner while initializing
  if (auth.loading && !deviceCode) {
    return <LoadingSpinner />;
  }

  if (showPATInput) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center p-6">
        <PATInput onSubmit={handlePATSubmit} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white antialiased">
      <div className="max-w-2xl mx-auto p-6">
        <AuthSection
          auth={auth}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />

        {auth.token && (
          <>
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            <RepoForm
              org={org}
              repo={repo}
              branch={branch}
              onOrgChange={setOrg}
              onRepoChange={setRepo}
              onBranchChange={setBranch}
            />

            {activeTab === 'info' ? (
              <RepoInfoTab
                loading={loading}
                info={info}
                onSubmit={handleSubmit}
              />
            ) : (
              <CommitTab
                loading={loading}
                authStatus={auth}
                filePath={filePath}
                fileContent={fileContent}
                commitMessage={commitMessage}
                onFilePathChange={setFilePath}
                onFileContentChange={setFileContent}
                onCommitMessageChange={setCommitMessage}
                onSubmit={handleCommit}
                commitSuccess={commitSuccess}
              />
            )}
          </>
        )}

        {error && <ErrorMessage message={error} />}
      </div>
    </div>
  );
}

export default App;
