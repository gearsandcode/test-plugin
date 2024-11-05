export async function fetchRepoInfo(org: string, repo: string, branch: string) {
  try {
    const baseUrl = 'https://api.github.com';
    const headers = {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    // Fetch repo and branch data in parallel
    const [repoResponse, branchResponse] = await Promise.all([
      fetch(`${baseUrl}/repos/${org}/${repo}`, { headers }),
      fetch(`${baseUrl}/repos/${org}/${repo}/branches/${branch}`, { headers }),
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
    if (error instanceof Error) {
      throw {
        message: error.message,
        status: 500,
      };
    }
    throw {
      message: 'An unknown error occurred',
      status: 500,
    };
  }
}
