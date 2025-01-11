interface GitHubResponse {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
}

/**
 * Wrapper for GitHub API requests that handles authentication and common headers
 * @param url - The GitHub API endpoint URL
 * @param options - Request options including the GitHub token
 * @returns Promise containing the API response
 */
export async function githubFetch(
  url: string,
  options: RequestInit & { token: string }
): Promise<GitHubResponse> {
  const { token, ...fetchOptions } = options;

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    json: () => response.json(),
  };
}
