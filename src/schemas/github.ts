/**
 * @fileoverview src/schemas/github.ts - GitHub API schemas with looser validation
 */
import { z } from "zod";

/**
 * Common GitHub API response fields with looser validation
 * Making optional fields that might not always be present
 */
export const GitHubUserSchema = z
  .object({
    login: z.string(),
    id: z.number(),
    avatar_url: z.string(),
    html_url: z.string(),
  })
  .partial();

export const GitHubRepoSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    private: z.boolean(),
    html_url: z.string(),
  })
  .partial();

/**
 * Repository branch reference
 */
export const BranchRefSchema = z.object({
  ref: z.string(),
  node_id: z.string().optional(),
  url: z.string(),
  object: z.object({
    sha: z.string(),
    type: z.string(),
    url: z.string(),
  }),
});

/**
 * Repository branch
 */
export const BranchSchema = z.object({
  name: z.string(),
  commit: z.object({
    sha: z.string(),
    url: z.string(),
  }),
  protected: z.boolean(),
});

/**
 * Pull request with more permissive validation
 */
export const PullRequestSchema = z.object({
  url: z.string(),
  id: z.number(),
  node_id: z.string().optional(),
  html_url: z.string(),
  number: z.number(),
  state: z.enum(["open", "closed"]),
  title: z.string(),
  user: GitHubUserSchema.optional(),
  body: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  head: z.object({
    label: z.string().optional(),
    ref: z.string(),
    sha: z.string().optional(),
    user: GitHubUserSchema.optional(),
    repo: GitHubRepoSchema.optional(),
  }),
  base: z.object({
    label: z.string().optional(),
    ref: z.string(),
    sha: z.string().optional(),
    user: GitHubUserSchema.optional(),
    repo: GitHubRepoSchema.optional(),
  }),
  merged: z.boolean().optional(),
  mergeable: z.boolean().nullable().optional(),
  rebaseable: z.boolean().nullable().optional(),
  mergeable_state: z.string().optional(),
  locked: z.boolean().optional(),
});

/**
 * Git blob
 */
export const BlobSchema = z.object({
  sha: z.string(),
  url: z.string(),
  size: z.number().optional(),
});

/**
 * Git tree
 */
export const TreeSchema = z.object({
  sha: z.string(),
  url: z.string(),
  tree: z.array(
    z.object({
      path: z.string(),
      mode: z.string(),
      type: z.string(),
      sha: z.string(),
      url: z.string(),
    })
  ),
});

/**
 * Git commit
 */
export const CommitSchema = z.object({
  sha: z.string(),
  url: z.string(),
  author: z
    .object({
      name: z.string(),
      email: z.string(),
      date: z.string(),
    })
    .optional(),
  message: z.string(),
  tree: z.object({
    sha: z.string(),
    url: z.string(),
  }),
});

/**
 * GitHub API error
 */
export const GitHubErrorSchema = z.object({
  message: z.string(),
  documentation_url: z.string().optional(),
  errors: z
    .array(
      z.object({
        resource: z.string(),
        field: z.string(),
        code: z.string(),
      })
    )
    .optional(),
});

// Type exports
export type GitHubUser = z.infer<typeof GitHubUserSchema>;
export type GitHubRepo = z.infer<typeof GitHubRepoSchema>;
export type BranchRef = z.infer<typeof BranchRefSchema>;
export type Branch = z.infer<typeof BranchSchema>;
export type PullRequest = z.infer<typeof PullRequestSchema>;
export type Blob = z.infer<typeof BlobSchema>;
export type Tree = z.infer<typeof TreeSchema>;
export type Commit = z.infer<typeof CommitSchema>;
export type GitHubError = z.infer<typeof GitHubErrorSchema>;

/**
 * Type guard for GitHub errors
 */
export function isGitHubError(response: unknown): response is GitHubError {
  return GitHubErrorSchema.safeParse(response).success;
}

/**
 * Helper to debug API validation errors
 */
export function debugValidation<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): void {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.log("Validation failed for data:", data);
    console.log("Validation errors:", result.error.errors);
  }
}
