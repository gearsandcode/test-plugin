import { useState } from "react";
import type { StoredSettings } from "../types";

interface CreatePRParams {
  title: string;
  branch: string;
  baseBranch: string;
  description: string;
  content: string;
  label?: string;
}

interface GitHubResponse {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
}

async function githubFetch(
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

export function useGitHubPR(settings: StoredSettings) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPR = async ({
    title,
    branch,
    baseBranch,
    description,
    content,
    label,
  }: CreatePRParams) => {
    if (!settings.token || !settings.organization || !settings.repository) {
      throw new Error("Missing required GitHub settings");
    }

    setLoading(true);
    setError(null);

    const baseUrl = `https://api.github.com/repos/${settings.organization}/${settings.repository}`;

    try {
      // 1. Get the base branch reference
      const baseRef = await githubFetch(
        `${baseUrl}/git/refs/heads/${baseBranch}`,
        { token: settings.token }
      );

      if (!baseRef.ok) {
        throw new Error(`Failed to get base branch: ${baseBranch}`);
      }

      const baseRefData = await baseRef.json();

      // 2. Create a new branch
      const createRef = await githubFetch(`${baseUrl}/git/refs`, {
        method: "POST",
        token: settings.token,
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: baseRefData.object.sha,
        }),
      });

      if (!createRef.ok) {
        throw new Error(`Failed to create branch: ${branch}`);
      }

      // 3. Create a blob for the file content
      const createBlob = await githubFetch(`${baseUrl}/git/blobs`, {
        method: "POST",
        token: settings.token,
        body: JSON.stringify({
          content,
          encoding: "utf-8",
        }),
      });

      if (!createBlob.ok) {
        throw new Error("Failed to create content blob");
      }

      const blobData = await createBlob.json();

      // 4. Create a tree
      const createTree = await githubFetch(`${baseUrl}/git/trees`, {
        method: "POST",
        token: settings.token,
        body: JSON.stringify({
          base_tree: baseRefData.object.sha,
          tree: [
            {
              path: "variables.json",
              mode: "100644",
              type: "blob",
              sha: blobData.sha,
            },
          ],
        }),
      });

      if (!createTree.ok) {
        throw new Error("Failed to create tree");
      }

      const treeData = await createTree.json();

      // 5. Create a commit
      const createCommit = await githubFetch(`${baseUrl}/git/commits`, {
        method: "POST",
        token: settings.token,
        body: JSON.stringify({
          message: title,
          tree: treeData.sha,
          parents: [baseRefData.object.sha],
        }),
      });

      if (!createCommit.ok) {
        throw new Error("Failed to create commit");
      }

      const commitData = await createCommit.json();

      // 6. Update the branch reference to point to the new commit
      const updateRef = await githubFetch(
        `${baseUrl}/git/refs/heads/${branch}`,
        {
          method: "PATCH",
          token: settings.token,
          body: JSON.stringify({
            sha: commitData.sha,
            force: true,
          }),
        }
      );

      if (!updateRef.ok) {
        throw new Error("Failed to update branch reference");
      }

      // 7. Create the pull request
      console.log("Creating pull request...");
      const createPullRequest = await githubFetch(`${baseUrl}/pulls`, {
        method: "POST",
        token: settings.token,
        body: JSON.stringify({
          title,
          body: description,
          head: branch,
          base: baseBranch,
          draft: false,
        }),
      });

      if (!createPullRequest.ok) {
        const errorData = await createPullRequest.json();
        console.error("PR creation response:", errorData);
        throw new Error(
          `Failed to create pull request: ${
            errorData.message || "Unknown error"
          }`
        );
      }

      const prData = await createPullRequest.json();
      console.log("Pull request created:", prData);

      // 8. Add labels if provided
      if (label && prData.number) {
        console.log("Adding label:", label);
        await githubFetch(`${baseUrl}/issues/${prData.number}/labels`, {
          method: "POST",
          token: settings.token,
          body: JSON.stringify({ labels: [label] }),
        });
      }

      return prData;
    } catch (err) {
      console.error("Error in createPR:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create pull request";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createPR,
    loading,
    error,
  };
}
