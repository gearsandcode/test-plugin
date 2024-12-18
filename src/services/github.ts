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

import type { FileChange, DiffResult, CommitInfo } from "../types";
import { findJsonDiff, formatJsonDiff } from "../utils";
import { decodeBase64 } from "../utils";

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

  /**
   * Gets the content of a file from a specific branch
   */
  async getFileContent(path: string, branch: string): Promise<string | null> {
    try {
      const response = await this.request(
        `/contents/${path}?ref=${branch}`,
        { method: "GET" },
        z.object({
          content: z.string(),
          encoding: z.string(),
        })
      );

      return Buffer.from(response.content, "base64").toString("utf-8");
    } catch (error) {
      return null;
    }
  }

  /**
   * Compare local content with branch content
   */
  async getDiff(
    branchName: string,
    localContent: string
  ): Promise<string | null> {
    try {
      const branchContent = await this.getFileContent(
        "variables.json",
        branchName
      );
      if (!branchContent) {
        return this.createTempDiff("{}", localContent, "Initial variables");
      }

      if (branchContent === localContent) {
        return null; // No changes
      }

      return this.createTempDiff(
        branchContent,
        localContent,
        "Current changes"
      );
    } catch (error) {
      console.error("Error getting diff:", error);
      return null;
    }
  }

  /**
   * Gets the GitHub compare URL
   */
  getCompareUrl(branchName: string, baseBranch = "main"): string {
    return `https://github.com/${this.config.organization}/${this.config.repository}/compare/${baseBranch}...${branchName}`;
  }

  private createTempDiff(
    oldContent: string,
    newContent: string,
    description: string
  ): string {
    const oldLines = JSON.stringify(JSON.parse(oldContent), null, 2).split(
      "\n"
    );
    const newLines = JSON.stringify(JSON.parse(newContent), null, 2).split(
      "\n"
    );

    return [
      `diff --git a/variables.json b/variables.json`,
      `--- a/variables.json (${description})`,
      `+++ b/variables.json (Local changes)`,
      "@@ -1,1 +1,1 @@",
      ...oldLines.map((line) => "- " + line),
      ...newLines.map((line) => "+ " + line),
    ].join("\n");
  }

  /**
   * Gets the latest content from a branch
   */
  async getLatestContent(branch: string): Promise<string | null> {
    try {
      console.log(`Fetching content for branch: ${branch}`);

      const response = await this.request(
        `/contents/variables.json?ref=${branch}`,
        { method: "GET" },
        z.object({
          content: z.string(),
          encoding: z.string(),
        })
      );

      return decodeBase64(response.content);
    } catch (error: any) {
      if (error.status === 404) {
        console.warn(`Branch or file not found: ${branch}`);
        return null;
      }
      console.error("Error accessing content:", error);
      throw error;
    }
  }

  /**
   * Compare local content with branch content
   */
  async compareWithBranch(
    branchName: string,
    localContent: string
  ): Promise<DiffResult | null> {
    try {
      const [branchContent, commitInfo] = await Promise.all([
        this.getLatestContent(branchName),
        this.getLatestCommit(branchName),
      ]);

      if (!branchContent) {
        const changes = findJsonDiff("{}", localContent);
        return {
          path: "variables.json",
          content: formatJsonDiff(changes),
          commit: commitInfo || undefined,
        };
      }

      const changes = findJsonDiff(branchContent, localContent);
      return changes.length > 0
        ? {
            path: "variables.json",
            content: formatJsonDiff(changes),
            commit: commitInfo || undefined,
          }
        : null;
    } catch (error) {
      console.error("Error comparing with branch:", error);
      return null;
    }
  }

  /**
   * Gets content of files from the latest commit on a branch
   */
  async getBranchContents(
    branch: string,
    paths: string[]
  ): Promise<Map<string, string | null>> {
    const contents = new Map<string, string | null>();

    try {
      const branchRef = await this.getBranchRef(branch);
      if (!branchRef) return contents;

      await Promise.all(
        paths.map(async (path) => {
          try {
            const response = await this.request(
              `/contents/${path}?ref=${branchRef.object.sha}`,
              { method: "GET" },
              z.object({
                content: z.string(),
                encoding: z.string(),
              })
            );
            contents.set(
              path,
              Buffer.from(response.content, "base64").toString("utf-8")
            );
          } catch (error) {
            contents.set(path, null);
          }
        })
      );
    } catch (error) {
      console.error("Error getting branch contents:", error);
    }

    return contents;
  }

  async getLatestCommit(branch: string): Promise<CommitInfo | null> {
    try {
      const branchRef = await this.getBranchRef(branch);
      if (!branchRef) return null;

      const response = await this.request(
        `/commits/${branchRef.object.sha}`,
        { method: "GET" },
        z.object({
          sha: z.string(),
          commit: z.object({
            message: z.string(),
            author: z.object({
              name: z.string(),
              date: z.string(),
            }),
          }),
        })
      );

      return {
        sha: response.sha.substring(0, 7),
        message: response.commit.message,
        author: response.commit.author.name,
        date: new Date(response.commit.author.date).toLocaleString(),
      };
    } catch (error) {
      console.error("Error getting commit info:", error);
      return null;
    }
  }
}
