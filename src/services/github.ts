/**
 * @fileoverview GitHub service with consistent configuration interface
 */
import { z } from "zod";
import {
  PullRequestSchema,
  BranchRefSchema,
  BlobSchema,
  TreeSchema,
  CommitSchema,
  debugValidation,
  type PullRequest,
} from "../schemas/github";

interface GitHubServiceConfig {
  token: string;
  organization: string;
  repository: string;
}

export class GitHubService {
  private baseUrl: string;

  constructor(private config: GitHubServiceConfig, private debug = false) {
    this.baseUrl = `https://api.github.com/repos/${config.organization}/${config.repository}`;
  }

  /**
   * Helper method for making authenticated requests to GitHub API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    try {
      if (this.debug) {
        console.log("API Request:", {
          url,
          method: options.method,
          body: options.body ? JSON.parse(options.body as string) : undefined,
        });
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json();

      if (this.debug) {
        console.log("API Response:", {
          status: response.status,
          data,
        });
      }

      if (!response.ok) {
        throw new Error(
          `GitHub API Error: ${data.message || response.statusText}`
        );
      }

      // Debug validation issues
      if (this.debug) {
        debugValidation(schema, data);
      }

      const result = schema.safeParse(data);
      if (!result.success) {
        console.error("Validation errors:", result.error.errors);
        throw new Error("API response validation failed");
      }

      return result.data;
    } catch (error) {
      if (this.debug) {
        console.error("Request failed:", error);
      }
      throw error;
    }
  }

  /**
   * Gets the current reference (SHA) for a branch
   */
  private async getBranchRef(branch: string) {
    return this.request(
      `/git/refs/heads/${branch}`,
      { method: "GET" },
      BranchRefSchema
    );
  }

  /**
   * Creates a blob with the file content
   */
  private async createBlob(content: string) {
    return this.request(
      "/git/blobs",
      {
        method: "POST",
        body: JSON.stringify({
          content,
          encoding: "utf-8",
        }),
      },
      BlobSchema
    );
  }

  /**
   * Creates a tree with the file
   */
  private async createTree(baseTree: string, path: string, blobSha: string) {
    return this.request(
      "/git/trees",
      {
        method: "POST",
        body: JSON.stringify({
          base_tree: baseTree,
          tree: [
            {
              path,
              mode: "100644",
              type: "blob",
              sha: blobSha,
            },
          ],
        }),
      },
      TreeSchema
    );
  }

  /**
   * Creates a commit
   */
  private async createCommit(
    message: string,
    treeSha: string,
    parentSha: string
  ) {
    return this.request(
      "/git/commits",
      {
        method: "POST",
        body: JSON.stringify({
          message,
          tree: treeSha,
          parents: [parentSha],
        }),
      },
      CommitSchema
    );
  }

  /**
   * Updates a branch reference
   */
  private async updateRef(branch: string, sha: string) {
    return this.request(
      `/git/refs/heads/${branch}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          sha,
          force: true,
        }),
      },
      BranchRefSchema
    );
  }

  /**
   * Commits changes to a branch
   */
  async commitChanges({
    branch,
    message,
    content,
    path = "variables.json",
  }: {
    branch: string;
    message: string;
    content: string;
    path?: string;
  }) {
    if (this.debug) {
      console.log("Starting commit process for branch:", branch);
    }

    // Get the current commit SHA
    const branchRef = await this.getBranchRef(branch);
    const parentSha = branchRef.object.sha;

    // Create a blob with the content
    const blob = await this.createBlob(content);

    // Create a tree with the new blob
    const tree = await this.createTree(parentSha, path, blob.sha);

    // Create a commit with the new tree
    const commit = await this.createCommit(message, tree.sha, parentSha);

    // Update the branch reference
    await this.updateRef(branch, commit.sha);

    if (this.debug) {
      console.log("Commit completed:", commit);
    }

    return commit;
  }

  /**
   * Finds an existing pull request
   */
  async findPullRequest(
    head: string,
    base: string
  ): Promise<PullRequest | null> {
    try {
      const pulls = await this.request(
        `/pulls?head=${this.config.organization}:${head}&base=${base}&state=open`,
        { method: "GET" },
        z.array(PullRequestSchema)
      );

      return pulls[0] || null;
    } catch (error) {
      console.error("Error finding pull request:", error);
      return null;
    }
  }
}
