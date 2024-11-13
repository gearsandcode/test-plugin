import { useState, useEffect, useCallback } from "react";
import type { StoredSettings } from "../PluginStore";

export const useGitHubBranches = (settings: StoredSettings | null) => {
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchBranches = useCallback(async () => {
    if (!settings?.organization || !settings?.repository || !settings?.token) {
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

      const data = await response.json();
      setBranches(data.map((branch: { name: string }) => branch.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch branches");
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [settings?.organization, settings?.repository, settings?.token]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return {
    branches,
    loading,
    error,
    refetch: fetchBranches,
  };
};
