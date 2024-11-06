/// <reference types="@figma/plugin-typings" />

import { fetchRepoInfo, createCommit } from './api';
import { githubConfig } from './config';
import type { GitHubAuthState, PluginMessage, CommitFile } from './types';

figma.showUI(__html__, {
  width: 450,
  height: 600,
  themeColors: true,
});

let githubToken: GitHubAuthState | null = null;

async function handleFetchRepo(org: string, repo: string, branch: string) {
  try {
    const data = await fetchRepoInfo(org, repo, branch);
    figma.ui.postMessage({
      type: 'repo-info',
      data,
    });
  } catch (error: any) {
    console.error('Fetch repo error:', error);
    figma.ui.postMessage({
      type: 'error',
      message: error.message || 'Failed to fetch repository information',
    });
  }
}

async function handleCreateCommit(
  org: string,
  repo: string,
  branch: string,
  file: CommitFile,
  auth: GitHubAuthState
) {
  try {
    const result = await createCommit(org, repo, branch, file, auth);
    figma.ui.postMessage({
      type: 'commit-success',
      data: {
        sha: result.sha,
        url: result.url,
      },
    });
  } catch (error: any) {
    console.error('Create commit error:', error);
    figma.ui.postMessage({
      type: 'error',
      message: error.message || 'Failed to create commit',
    });
  }
}

async function initiateGitHubAuth() {
  try {
    // Check for existing token
    const token = await figma.clientStorage.getAsync('github-token');
    if (token) {
      // Validate existing token
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Figma-GitHub-Plugin',
        },
      });

      if (response.ok) {
        figma.ui.postMessage({
          type: 'auth-success',
          token: token,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          authType: 'user',
        });
        return;
      } else {
        // Clear invalid token
        await figma.clientStorage.deleteAsync('github-token');
      }
    }

    // Show PAT input UI
    figma.ui.postMessage({
      type: 'show-pat-input',
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    figma.ui.postMessage({
      type: 'auth-error',
      error: error.message || 'Failed to authenticate with GitHub',
    });
  }
}

async function handlePATSubmit(token: string) {
  try {
    // Validate the token
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Figma-GitHub-Plugin',
      },
    });

    if (!response.ok) {
      throw new Error('Invalid token');
    }

    // Store the token
    await figma.clientStorage.setAsync('github-token', token);

    // Notify UI of successful authentication
    figma.ui.postMessage({
      type: 'auth-success',
      token: token,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      authType: 'user',
    });
  } catch (error: any) {
    console.error('Token validation error:', error);
    figma.ui.postMessage({
      type: 'auth-error',
      error: error.message || 'Failed to validate token',
    });
  }
}

async function handleOAuthCallback(code: string, receivedState: string) {
  try {
    const savedState = await figma.clientStorage.getAsync('oauth-state');

    // Verify state parameter to prevent CSRF attacks
    if (savedState !== receivedState) {
      throw new Error('Invalid state parameter');
    }

    // Exchange code for token directly with GitHub
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: githubConfig.clientId,
          redirect_uri: githubConfig.redirectUri,
          code: code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await tokenResponse.json();
    const accessToken = data.access_token;

    if (!accessToken) {
      throw new Error('No access token received from GitHub');
    }

    // Store the token
    await figma.clientStorage.setAsync('github-token', accessToken);

    // Create auth state
    githubToken = {
      token: accessToken,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      type: 'user',
      error: null,
      loading: false,
    };

    // Notify UI of successful authentication
    figma.ui.postMessage({
      type: 'auth-success',
      token: accessToken,
      expiresAt: githubToken.expiresAt,
      authType: 'user',
    });

    // Close the auth window and show main UI
    figma.showUI(__html__, {
      width: 450,
      height: 600,
      themeColors: true,
    });
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    figma.ui.postMessage({
      type: 'auth-error',
      error: error.message || 'Failed to complete GitHub authentication',
    });
  } finally {
    // Clean up state
    await figma.clientStorage.deleteAsync('oauth-state');
  }
}

async function checkExistingAuth() {
  try {
    const storedToken = await figma.clientStorage.getAsync('github-token');
    if (storedToken) {
      // Validate token
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        githubToken = {
          token: storedToken,
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          type: 'user',
          error: null,
          loading: false,
        };

        figma.ui.postMessage({
          type: 'auth-success',
          token: storedToken,
          expiresAt: githubToken.expiresAt,
          authType: 'user',
        });
        return;
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }

  // Clear invalid token
  githubToken = null;
  await figma.clientStorage.deleteAsync('github-token');
}

function handleLogout() {
  githubToken = null;
  figma.clientStorage.deleteAsync('github-token').catch(console.error);
}

// Check for existing auth on startup
checkExistingAuth();

figma.ui.onmessage = async function (msg: PluginMessage) {
  switch (msg.type) {
    case 'fetch-repo':
      await handleFetchRepo(msg.org, msg.repo, msg.branch);
      break;

    case 'create-commit':
      if (!msg.auth?.token) {
        figma.ui.postMessage({
          type: 'error',
          message: 'Authentication required',
        });
        return;
      }
      await handleCreateCommit(
        msg.org,
        msg.repo,
        msg.branch,
        msg.file,
        msg.auth
      );
      break;

    case 'initiate-github-auth':
      await initiateGitHubAuth();
      break;

    case 'oauth-callback':
      if (!msg.code || !msg.state) {
        figma.ui.postMessage({
          type: 'auth-error',
          error: 'Invalid OAuth callback data',
        });
        return;
      }
      await handleOAuthCallback(msg.code, msg.state);
      break;

    case 'logout':
      handleLogout();
      break;

    case 'submit-pat':
      await handlePATSubmit(msg.token);
      break;
  }
};
