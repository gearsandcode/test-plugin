import { useState, useEffect } from "react";
import type { StoredSettings } from "../types";

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export function useGitHubBranches(settings: StoredSettings) {
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchBranches = async () => {
      if (!settings.organization || !settings.repository || !settings.token) {
        setError("Missing required settings");
        setBranches([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `https://api.github.com/repos/${settings.organization}/${settings.repository}/branches`,
          {
            headers: {
              Authorization: `Bearer ${settings.token}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch branches");
        }

        const data: GitHubBranch[] = await response.json();
        // Extract only the branch names from the response
        const branchNames = data.map((branch) => branch.name);
        setBranches(branchNames);
      } catch (err) {
        console.error("Error fetching branches:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch branches"
        );
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [settings.organization, settings.repository, settings.token]);

  return {
    branches,
    loading,
    error,
  };
}
