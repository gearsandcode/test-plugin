import { useState } from "react";
import type { StoredSettings, CommitData } from "../PluginStore";

export const useCommit = (settings: StoredSettings | null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const createCommit = async (commitData: CommitData) => {
    if (!settings?.organization || !settings?.repository || !settings?.token) {
      setError("Missing required settings");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get branch reference
      const branchRef = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/git/refs/heads/${commitData.branch}`,
        {
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      const branchData = await branchRef.json();
      if (!branchRef.ok)
        throw new Error(branchData.message || "Failed to get branch reference");

      // Create blob
      const blobResponse = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/git/blobs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: commitData.file,
            encoding: "utf-8",
          }),
        }
      );

      const blobData = await blobResponse.json();
      if (!blobResponse.ok)
        throw new Error(blobData.message || "Failed to create blob");

      // Get current tree
      const treeResponse = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/git/trees/${branchData.object.sha}`,
        {
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      const treeData = await treeResponse.json();
      if (!treeResponse.ok)
        throw new Error(treeData.message || "Failed to get tree");

      // Create new tree
      const newTreeResponse = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/git/trees`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base_tree: treeData.sha,
            tree: [
              {
                path: commitData.filename,
                mode: "100644",
                type: "blob",
                sha: blobData.sha,
              },
            ],
          }),
        }
      );

      const newTreeData = await newTreeResponse.json();
      if (!newTreeResponse.ok)
        throw new Error(newTreeData.message || "Failed to create tree");

      // Create commit
      const commitResponse = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/git/commits`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: commitData.message || `Update ${commitData.filename}`,
            tree: newTreeData.sha,
            parents: [branchData.object.sha],
          }),
        }
      );

      const commitResponseData = await commitResponse.json();
      if (!commitResponse.ok)
        throw new Error(
          commitResponseData.message || "Failed to create commit"
        );

      // Update reference
      const updateRefResponse = await fetch(
        `https://api.github.com/repos/${settings.organization}/${settings.repository}/git/refs/heads/${commitData.branch}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${settings.token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sha: commitResponseData.sha,
            force: true,
          }),
        }
      );

      if (!updateRefResponse.ok) {
        const updateRefData = await updateRefResponse.json();
        throw new Error(updateRefData.message || "Failed to update reference");
      }

      parent.postMessage(
        { pluginMessage: { type: "create-commit", success: true } },
        "*"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return {
    createCommit,
    loading,
    error,
  };
};
