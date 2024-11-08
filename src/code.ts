/// <reference types="@figma/plugin-typings" />

import { fetchRepoInfo, createCommit } from './api';
import { CreatePRParams } from './types';
import { base64Encode } from './utils/base64';
import { githubConfig } from './config';
import type { GitHubAuthState, PluginMessage, CommitFile } from './types';

console.log('Plugin starting...');

figma.showUI(__html__, {
  width: 450,
  height: 600,
  themeColors: true,
});

let githubToken: GitHubAuthState | null = null;

async function createGitHubPR({
  owner,
  repo,
  path,
  content,
  message,
}: CreatePRParams) {
  try {
    const branchName = `figma/changes-${Date.now()}`;
    const encodedContent = base64Encode(content); // Using our custom encoder

    // Create branch
    const response = await fetch(
      `${githubConfig.apiUrl}/repos/${owner}/${repo}/git/refs/heads/main`,
      {
        headers: {
          Authorization: `Bearer ${githubConfig.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get main branch: ${response.statusText}`);
    }

    const {
      object: { sha: mainSha },
    } = await response.json();

    // Create new branch
    const branchResponse = await fetch(
      `${githubConfig.apiUrl}/repos/${owner}/${repo}/git/refs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubConfig.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: mainSha,
        }),
      }
    );

    if (!branchResponse.ok) {
      throw new Error(`Failed to create branch: ${branchResponse.statusText}`);
    }

    // Create or update file
    const fileResponse = await fetch(
      `${githubConfig.apiUrl}/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubConfig.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: encodedContent,
          branch: branchName,
        }),
      }
    );

    if (!fileResponse.ok) {
      throw new Error(`Failed to create file: ${fileResponse.statusText}`);
    }

    // Create PR
    const prResponse = await fetch(
      `${githubConfig.apiUrl}/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubConfig.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Figma: ${message}`,
          head: branchName,
          base: 'main',
          body: 'Created via Figma Plugin',
          labels: ['figma-plugin'],
        }),
      }
    );

    if (!prResponse.ok) {
      throw new Error(`Failed to create PR: ${prResponse.statusText}`);
    }

    const prData = await prResponse.json();

    figma.ui.postMessage({
      type: 'pr-created',
      data: {
        url: prData.html_url,
        number: prData.number,
      },
    });
  } catch (error) {
    console.error('Failed to create PR:', error);
    figma.ui.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to create PR',
    });
  }
}

function encodeFormData(data: Record<string, string>): string {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
}

async function initiateGitHubAuth() {
  try {
    // Step 1: Get device code
    const response = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Figma-GitHub-Plugin',
      },
      body: encodeFormData({
        client_id: githubConfig.clientId,
        scope: 'repo',
      }),
    });

    console.log('Device code response status:', response.status);
    const responseText = await response.text();
    console.log('Device code response:', responseText);

    if (!response.ok) {
      throw new Error(`Failed to get device code: ${responseText}`);
    }

    const data = JSON.parse(responseText);

    const { device_code, user_code, verification_uri, expires_in, interval } =
      data;

    // Show the verification code to user
    figma.ui.postMessage({
      type: 'show-device-code',
      data: {
        userCode: user_code,
        verificationUrl: verification_uri,
      },
    });

    // Open verification URL in browser
    figma.openExternal(verification_uri);

    // Step 2: Poll for token
    const pollStartTime = Date.now();
    const expiresAt = pollStartTime + expires_in * 1000;

    while (Date.now() < expiresAt) {
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));

      const tokenResponse = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Figma-GitHub-Plugin',
          },
          body: encodeFormData({
            client_id: githubConfig.clientId,
            device_code,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          }),
        }
      );

      if (!tokenResponse.ok) {
        const tokenErrorText = await tokenResponse.text();
        console.log('Token response error:', tokenErrorText);
        continue;
      }

      const tokenData = await tokenResponse.json();

      if (tokenData.error === 'authorization_pending') {
        continue;
      }

      if (tokenData.access_token) {
        // Success! Store the token
        await figma.clientStorage.setAsync(
          'github-token',
          tokenData.access_token
        );

        githubToken = {
          token: tokenData.access_token,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          type: 'user',
          error: null,
          loading: false,
        };

        figma.ui.postMessage({
          type: 'auth-success',
          token: tokenData.access_token,
          expiresAt: githubToken.expiresAt,
          authType: 'user',
        });

        return;
      }
    }

    throw new Error('Authentication timed out');
  } catch (error) {
    console.error('Auth error:', error);
    figma.ui.postMessage({
      type: 'auth-error',
      error:
        error instanceof Error
          ? error.message
          : 'Failed to authenticate with GitHub',
    });
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
          'User-Agent': 'Figma-GitHub-Plugin',
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

// Check for existing auth on startup
checkExistingAuth();

figma.ui.onmessage = async function (msg: PluginMessage) {
  console.log('Received message:', msg.type);

  try {
    switch (msg.type) {
      case 'initiate-github-auth':
        await initiateGitHubAuth();
        break;

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

      case 'logout':
        handleLogout();
        break;

      default:
        console.warn('Unknown message type:', msg.type);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    figma.ui.postMessage({
      type: 'error',
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
};

// figma.ui.onmessage = async function (msg: PluginMessage) {
//   console.log('Received message:', msg.type);

//   try {
//     switch (msg.type) {
//       case 'fetch-repo':
//         await handleFetchRepo(msg.org, msg.repo, msg.branch);
//         break;

//       case 'create-commit':
//         if (!msg.auth?.token) {
//           figma.ui.postMessage({
//             type: 'error',
//             message: 'Authentication required',
//           });
//           return;
//         }
//         await handleCreateCommit(
//           msg.org,
//           msg.repo,
//           msg.branch,
//           msg.file,
//           msg.auth
//         );
//         break;

//       case 'initiate-github-auth':
//         await initiateGitHubAuth();
//         break;

//       case 'logout':
//         handleLogout();
//         break;

//       default:
//         console.warn('Unknown message type:', msg.type);
//     }
//   } catch (error) {
//     console.error('Error handling message:', error);
//     figma.ui.postMessage({
//       type: 'error',
//       message:
//         error instanceof Error ? error.message : 'An unexpected error occurred',
//     });
//   }
// };
