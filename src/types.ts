export interface GithubConfig {
  token: string;
  clientId: string;
  redirectUri: string;
  apiUrl: string;
}

export interface CreatePRParams {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
}

export interface PRResponse {
  html_url: string;
  number: number;
}

export interface RepoInfo {
  full_name: string;
  description: string | null;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  visibility: string;
  updated_at: string;
}

export interface BranchInfo {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface RepoData {
  repo: RepoInfo;
  branch: BranchInfo;
}

export interface CommitFile {
  path: string;
  content: string;
  message: string;
}

export interface GitHubAuthState {
  token: string | null;
  expiresAt: string | null;
  type: 'app' | 'user' | null;
  error: string | null;
  loading: boolean;
}

export interface GitHubUserAuth {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface CommitResponse {
  sha: string;
  url: string;
  message: string;
}

export interface GitHubAppConfig {
  appId: string;
  installationId: string;
  privateKey: string;
  clientId: string;
  redirectUri: string;
  authServerUrl: string;
}

export interface AuthTokenResponse {
  token: string;
  expires_at: string;
  permissions: {
    contents: string;
    metadata: string;
  };
}

export type PluginMessage =
  | { type: 'fetch-repo'; org: string; repo: string; branch: string }
  | {
      type: 'create-commit';
      org: string;
      repo: string;
      branch: string;
      file: CommitFile;
      auth: GitHubAuthState;
    }
  | { type: 'initiate-github-auth' }
  | {
      type: 'show-device-code';
      data: { userCode: string; verificationUrl: string };
    }
  | { type: 'auth-success'; token: string; expiresAt: string; authType: 'user' }
  | { type: 'auth-error'; error: string }
  | { type: 'commit-success'; data: { sha: string; url: string } }
  | { type: 'error'; message: string }
  | { type: 'logout' }
  | { type: 'repo-info'; data: RepoData };

// Helper type for UI message handling
export type UIMessage = Extract<
  PluginMessage,
  {
    type:
      | 'repo-info'
      | 'auth-success'
      | 'auth-error'
      | 'commit-success'
      | 'error';
  }
>;

// Helper type for Plugin message handling
export type PluginToUIMessage = Extract<
  PluginMessage,
  {
    type:
      | 'fetch-repo'
      | 'create-commit'
      | 'initiate-github-auth'
      | 'oauth-callback'
      | 'logout';
  }
>;

// Add any missing type definitions you need for your auth and commit functionality
export interface CommitFile {
  path: string;
  content: string;
  message: string;
}

export interface GitHubAuthState {
  token: string | null;
  expiresAt: string | null;
  type: 'app' | 'user' | null;
  error: string | null;
  loading: boolean;
}

export interface RepoData {
  repo: RepoInfo;
  branch: BranchInfo;
}

export interface GitHubOAuthResponse {
  access_token: string;
  token_type: string;
  scope: string;
}
