import { githubConfig } from './config';
import type { RepoData, CommitFile, GitHubAuthState } from './types';

export async function fetchRepoInfo(
  org: string,
  repo: string,
  branch: string
): Promise<RepoData> {
  try {
    // Fetch repo and branch data in parallel
    const [repoResponse, branchResponse] = await Promise.all([
      fetch(`${githubConfig.apiUrl}/repos/${org}/${repo}`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
      }),
      fetch(`${githubConfig.apiUrl}/repos/${org}/${repo}/branches/${branch}`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
      }),
    ]);

    if (!repoResponse.ok || !branchResponse.ok) {
      throw new Error(
        repoResponse.ok ? 'Branch not found' : 'Repository not found'
      );
    }

    const repoData = await repoResponse.json();
    const branchData = await branchResponse.json();

    return {
      repo: {
        full_name: repoData.full_name,
        description: repoData.description,
        default_branch: repoData.default_branch,
        stargazers_count: repoData.stargazers_count,
        forks_count: repoData.forks_count,
        open_issues_count: repoData.open_issues_count,
        language: repoData.language,
        visibility: repoData.visibility,
        updated_at: repoData.updated_at,
      },
      branch: {
        name: branchData.name,
        commit: {
          sha: branchData.commit.sha,
          url: branchData.commit.url,
        },
        protected: branchData.protected,
      },
    };
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof Error) {
      throw {
        message: error.message,
        status: error instanceof Response ? error.status : 500,
      };
    }
    throw {
      message: 'An unknown error occurred',
      status: 500,
    };
  }
}

export async function createCommit(
  org: string,
  repo: string,
  branch: string,
  file: CommitFile,
  auth: GitHubAuthState
): Promise<{ sha: string; url: string }> {
  try {
    if (!auth.token) {
      throw new Error('Authentication token is required');
    }

    const headers = {
      Authorization: `Bearer ${auth.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    // Get the latest commit SHA
    const branchResponse = await fetch(
      `${githubConfig.apiUrl}/repos/${org}/${repo}/git/refs/heads/${branch}`,
      { headers }
    );

    if (!branchResponse.ok) {
      throw new Error(
        `Failed to get branch reference: ${branchResponse.status}`
      );
    }

    const branchData = await branchResponse.json();
    const latestCommitSha = branchData.object.sha;

    // Get the current tree
    const treeResponse = await fetch(
      `${githubConfig.apiUrl}/repos/${org}/${repo}/git/trees/${latestCommitSha}`,
      { headers }
    );

    if (!treeResponse.ok) {
      throw new Error(`Failed to get tree: ${treeResponse.status}`);
    }

    // Create a new blob with the file content
    const blobResponse = await fetch(
      `${githubConfig.apiUrl}/repos/${org}/${repo}/git/blobs`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8',
        }),
      }
    );

    if (!blobResponse.ok) {
      throw new Error(`Failed to create blob: ${blobResponse.status}`);
    }

    const blobData = await blobResponse.json();

    // Create a new tree
    const newTreeResponse = await fetch(
      `${githubConfig.apiUrl}/repos/${org}/${repo}/git/trees`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base_tree: latestCommitSha,
          tree: [
            {
              path: file.path,
              mode: '100644',
              type: 'blob',
              sha: blobData.sha,
            },
          ],
        }),
      }
    );

    if (!newTreeResponse.ok) {
      throw new Error(`Failed to create tree: ${newTreeResponse.status}`);
    }

    const newTreeData = await newTreeResponse.json();

    // Create a new commit
    const commitResponse = await fetch(
      `${githubConfig.apiUrl}/repos/${org}/${repo}/git/commits`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: file.message,
          tree: newTreeData.sha,
          parents: [latestCommitSha],
        }),
      }
    );

    if (!commitResponse.ok) {
      throw new Error(`Failed to create commit: ${commitResponse.status}`);
    }

    const commitData = await commitResponse.json();

    // Update the reference
    const updateRefResponse = await fetch(
      `${githubConfig.apiUrl}/repos/${org}/${repo}/git/refs/heads/${branch}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: commitData.sha,
          force: false,
        }),
      }
    );

    if (!updateRefResponse.ok) {
      throw new Error(
        `Failed to update reference: ${updateRefResponse.status}`
      );
    }

    return {
      sha: commitData.sha,
      url: commitData.html_url,
    };
  } catch (error) {
    console.error('Commit error:', error);
    if (error instanceof Error) {
      throw {
        message: error.message,
        status: error instanceof Response ? error.status : 500,
      };
    }
    throw {
      message: 'An unknown error occurred during commit',
      status: 500,
    };
  }
}
